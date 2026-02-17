"use client";

import React, { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "@/types/smart-note";
import { Sprint } from "@/types/project";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GripVertical, Plus, Calendar, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface SprintBacklogProps {
  tasks: Task[];
  sprints: Sprint[];
  onAssignToSprint: (taskId: string, sprintId: string | null) => Promise<void>;
  onCreateSprint: () => void;
}

export function SprintBacklog({
  tasks,
  sprints,
  onAssignToSprint,
  onCreateSprint,
}: SprintBacklogProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const unassignedTasks = tasks.filter((t) => !t.sprintId);

  const handleDragStart = (event: { active: { id: string } }) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event: { active: { id: string }; over: { id: string } | null }) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      // Logic to move task to a different sprint
      const taskId = active.id;
      const overId = over.id as string;

      // If over is a sprint container or a task in a sprint
      let targetSprintId: string | null = null;
      if (overId === "backlog-root") {
        targetSprintId = null;
      } else if (overId.startsWith("sprint-container-")) {
        targetSprintId = overId.replace("sprint-container-", "");
      } else {
        // Find task and its sprint
        const overTask = tasks.find((t) => t.id === overId);
        if (overTask) targetSprintId = overTask.sprintId || null;
      }

      await onAssignToSprint(taskId, targetSprintId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Backlog do Projeto</h2>
        <Button onClick={onCreateSprint} size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Novo Sprint
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 gap-6">
          {/* Sprints Sections */}
          {sprints.map((sprint) => (
            <SprintBucket
              key={sprint.id}
              sprint={sprint}
              tasks={tasks.filter((t) => t.sprintId === sprint.id)}
            />
          ))}

          {/* Unassigned Backlog */}
          <Card className={cn(
            "border-2 border-dashed",
            unassignedTasks.length === 0 && "opacity-50"
          )} id="backlog-root">
            <CardHeader className="py-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Aguardando Sprint ({unassignedTasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2">
              <SortableContext
                items={unassignedTasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1 min-h-[50px]">
                  {unassignedTasks.map((task) => (
                    <SortableTaskItem key={task.id} task={task} />
                  ))}
                  {unassignedTasks.length === 0 && (
                    <div className="text-center py-4 text-xs text-muted-foreground">
                      Nenhuma tarefa no backlog principal.
                    </div>
                  )}
                </div>
              </SortableContext>
            </CardContent>
          </Card>
        </div>

        <DragOverlay dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: '0.5',
              },
            },
          }),
        }}>
          {activeId ? (
            <TaskOverlayItem task={tasks.find((t) => t.id === activeId)!} />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function SprintBucket({ sprint, tasks }: { sprint: Sprint; tasks: Task[] }) {
  const { setNodeRef } = useSortable({
    id: `sprint-container-${sprint.id}`,
  });

  const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);

  return (
    <Card ref={setNodeRef} className={cn(
      "border-l-4",
      sprint.status === "active" ? "border-l-primary" : "border-l-muted"
    )}>
      <CardHeader className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">{sprint.name}</CardTitle>
            <Badge variant={sprint.status === "active" ? "default" : "secondary"}>
              {sprint.status === "active" ? "Ativo" : sprint.status === "completed" ? "Concluído" : "Planejado"}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {sprint.startDate.toDate().toLocaleDateString()} - {sprint.endDate.toDate().toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1 font-bold">
              <Target className="h-3.5 w-3.5" />
              {totalPoints} pts
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{sprint.goal}</p>
      </CardHeader>
      <CardContent className="px-2 pb-2">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-1 min-h-[50px]">
            {tasks.map((task) => (
              <SortableTaskItem key={task.id} task={task} />
            ))}
            {tasks.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed rounded-lg text-xs text-muted-foreground">
                Arraste tarefas aqui para planejar o sprint.
              </div>
            )}
          </div>
        </SortableContext>
      </CardContent>
    </Card>
  );
}

function SortableTaskItem({ task }: { task: Task }) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-3 p-2 bg-card border rounded-md hover:border-primary/50 transition-colors shadow-sm",
        isDragging && "opacity-50 grayscale"
      )}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground">
        <GripVertical className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{task.title}</div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-muted/50">
          {task.status === "done" ? "Pronto" : task.status === "in_progress" ? "Fazendo" : "A fazer"}
        </Badge>
        {task.storyPoints && (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
            {task.storyPoints}
          </div>
        )}
      </div>
    </div>
  );
}

function TaskOverlayItem({ task }: { task: Task }) {
  return (
    <div className="flex items-center gap-3 p-2 bg-card border-2 border-primary rounded-md shadow-xl w-80">
      <GripVertical className="h-4 w-4 text-primary" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{task.title}</div>
      </div>
      {task.storyPoints && (
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
          {task.storyPoints}
        </div>
      )}
    </div>
  );
}
