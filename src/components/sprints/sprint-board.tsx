"use client";

import React, { useState } from "react";
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task, TaskStatus } from "@/types/smart-note";
import { Sprint } from "@/types/project";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GripVertical, Clock, ListTodo, Target, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { BurndownChart } from "@/components/charts/burndown-chart";

interface SprintBoardProps {
  sprint: Sprint;
  tasks: Task[];
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  onCompleteSprint: () => Promise<void>;
}

const COLUMNS: { id: TaskStatus; label: string; icon: React.ElementType; color: string }[] = [
  { id: "todo", label: "A Fazer", icon: ListTodo, color: "bg-slate-500" },
  { id: "in_progress", label: "Em Progresso", icon: Clock, color: "bg-blue-500" },
  { id: "done", label: "Concluído", icon: Trophy, color: "bg-emerald-500" },
];

export function SprintBoard({
  sprint,
  tasks,
  onUpdateTaskStatus,
  onCompleteSprint,
}: SprintBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id.toString());
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const taskId = active.id.toString();
      const overId = over.id.toString();

      let newStatus: TaskStatus | null = null;
      
      // If dropped over a column
      if (overId === "todo" || overId === "in_progress" || overId === "done") {
        newStatus = overId as TaskStatus;
      } else {
        // Find task and its status
        const overTask = tasks.find((t) => t.id === overId);
        if (overTask) newStatus = overTask.status;
      }

      if (newStatus) {
        await onUpdateTaskStatus(taskId, newStatus);
      }
    }
  };

  const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const donePoints = tasks.filter(t => t.status === "done").reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const progressPercent = totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">{sprint.name}</h2>
                  <Badge className="bg-primary/10 text-primary border-primary/20">Ativo</Badge>
                </div>
                <p className="text-muted-foreground flex items-center gap-2">
                  <Target className="h-4 w-4" /> {sprint.goal}
                </p>
              </div>
              <Button onClick={onCompleteSprint} variant="outline" className="gap-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700">
                <Trophy className="h-4 w-4" /> Finalizar Sprint
              </Button>
            </div>

            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>Progresso do Sprint</span>
                <span>{donePoints} de {totalPoints} pontos ({progressPercent}%)</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <BurndownChart sprint={sprint} tasks={tasks} />
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[500px]">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              label={column.label}
              icon={column.icon}
              color={column.color}
              tasks={tasks.filter((t) => t.status === column.id)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeId ? (
            <TaskCardOverlay task={tasks.find((t) => t.id === activeId)!} />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function KanbanColumn({ id, label, icon: Icon, color, tasks }: { 
  id: string; 
  label: string; 
  icon: React.ElementType; 
  color: string;
  tasks: Task[] 
}) {
  const { setNodeRef } = useSortable({ id });

  return (
    <div ref={setNodeRef} className="flex flex-col bg-muted/30 rounded-xl border border-dashed h-full min-h-[400px]">
      <div className="p-4 flex items-center justify-between border-b bg-background/50 rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className={cn("p-1.5 rounded-md text-white", color)}>
            <Icon className="h-4 w-4" />
          </div>
          <h3 className="font-bold text-sm uppercase tracking-tight">{label}</h3>
        </div>
        <Badge variant="secondary" className="text-[10px] font-bold">
          {tasks.length}
        </Badge>
      </div>
      
      <div className="p-2 flex-1">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {tasks.map((task) => (
              <SortableTaskCard key={task.id} task={task} />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

function SortableTaskCard({ task }: { task: Task }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const priorityColors = {
    urgent: "text-red-600 bg-red-50 border-red-100",
    high: "text-amber-600 bg-amber-50 border-amber-100",
    medium: "text-blue-600 bg-blue-50 border-blue-100",
    low: "text-slate-600 bg-slate-50 border-slate-100",
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "group cursor-pointer hover:shadow-md transition-shadow",
        isDragging && "opacity-0"
      )}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-semibold leading-snug line-clamp-2">{task.title}</h4>
          <div {...attributes} {...listeners} className="mt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="h-4 w-4" />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Badge variant="outline" className={cn("text-[10px] h-5 capitalize", priorityColors[task.priority])}>
            {task.priority}
          </Badge>
          
          {task.storyPoints && (
            <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
              <Target className="h-3 w-3" />
              {task.storyPoints}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TaskCardOverlay({ task }: { task: Task }) {
  return (
    <Card className="shadow-2xl border-primary ring-2 ring-primary/20 w-72 rotate-3">
      <CardContent className="p-4">
        <h4 className="text-sm font-bold">{task.title}</h4>
        <div className="mt-4 flex justify-between items-center">
          <Badge className="text-[10px] capitalize">{task.priority}</Badge>
          {task.storyPoints && (
            <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
              {task.storyPoints}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
