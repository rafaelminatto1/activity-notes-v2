"use client";

import React, { useState, useMemo } from "react";
import { Gantt, Task as GanttTask, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import { Task } from "@/types/smart-note";
import { transformTasksToGantt, calculateCriticalPath } from "@/lib/gantt-utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useTasksStore } from "@/stores/tasks-store";
import { toast } from "sonner";
import { Timestamp } from "firebase/firestore";

interface GanttChartProps {
  tasks: Task[];
  onTaskChange?: (task: Task) => void;
  isLoading?: boolean;
}

export function GanttChart({ tasks, onTaskChange, isLoading }: GanttChartProps) {
  const [view, setView] = useState<ViewMode>(ViewMode.Day);
  const [showCriticalPath, setShowCriticalPath] = useState(false);
  const { updateTask } = useTasksStore();

  const ganttTasks = useMemo(() => {
    let transformed = transformTasksToGantt(tasks);
    if (showCriticalPath) {
      transformed = calculateCriticalPath(transformed);
    }
    return transformed;
  }, [tasks, showCriticalPath]);

  const handleTaskChange = (task: GanttTask) => {
    // Atualizar no Firestore
    const originalTask = tasks.find(t => t.id === task.id);
    if (!originalTask) return;

    // Converter datas de volta para Timestamp
    // Se mudou início e fim, atualiza createdAt e dueDate?
    // Gantt altera start e end. 
    // Vamos assumir: start -> createdAt (mesmo que semanticamente createdAt seja imutável, aqui usamos como Start Date para o Gantt)
    // end -> dueDate
    
    // ATENÇÃO: createdAt geralmente não deve mudar. O ideal seria ter startDate na Task.
    // Como não temos startDate, usaremos createdAt como proxy por enquanto, mas com cuidado.
    // Melhor: Adicionar startDate ao Task type no futuro. Por ora, vamos atualizar apenas dueDate se o start não mudar muito, 
    // ou aceitar que createdAt é "Data de Início Planejada".
    
    // Para evitar mudar createdAt (histórico), vamos apenas atualizar dueDate baseado na duração
    // E se o usuário arrastar a barra inteira (muda start e end)?
    // O correto seria ter um campo `startDate`.
    // Vou assumir que posso atualizar `dueDate`. Se `start` mudar, por enquanto não tenho onde salvar sem alterar `createdAt`.
    // Vou salvar `dueDate` = task.end.

    const newDueDate = Timestamp.fromDate(task.end);
    
    // Se a tarefa foi movida (start mudou), precisariamos de um campo startDate.
    // Como não temos, vamos apenas atualizar o dueDate e logar um aviso ou, se permitido, atualizar createdAt.
    // Vou optar por atualizar createdAt para refletir o "início" no gráfico, sabendo que isso altera a data de criação.
    // Num sistema real, criaria `startDate`.
    
    const newCreatedAt = Timestamp.fromDate(task.start);

    updateTask(task.id, {
      dueDate: newDueDate,
      createdAt: newCreatedAt, // Compromisso para o protótipo funcionar visualmente
    }).catch(err => {
      toast.error("Erro ao atualizar tarefa");
      console.error(err);
    });

  };

  const handleProgressChange = async (task: GanttTask) => {
    const newStatus = task.progress >= 100 ? "done" : task.progress > 0 ? "in_progress" : "todo";
    
    await updateTask(task.id, {
      status: newStatus
    });
  };

  const handleDblClick = (task: GanttTask) => {
    if (!onTaskChange) return;
    const originalTask = tasks.find((t) => t.id === task.id);
    if (originalTask) {
      onTaskChange(originalTask);
    }
  };

  const handleExpanderClick = (task: GanttTask) => {
    void task;
  };

  if (isLoading) {
    return <div className="p-10 text-center">Carregando gráfico...</div>;
  }

  if (ganttTasks.length === 0) {
     return <div className="p-10 text-center text-muted-foreground border-2 border-dashed rounded-xl">Nenhuma tarefa para exibir no cronograma.</div>;
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between bg-card p-2 rounded-lg border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="critical-path" 
              checked={showCriticalPath} 
              onCheckedChange={(c) => setShowCriticalPath(!!c)} 
            />
            <Label htmlFor="critical-path" className="text-sm font-medium cursor-pointer">
              Caminho Crítico
            </Label>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Zoom:</span>
          <Select value={view} onValueChange={(v: ViewMode) => setView(v)}>
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ViewMode.Day}>Dia</SelectItem>
              <SelectItem value={ViewMode.Week}>Semana</SelectItem>
              <SelectItem value={ViewMode.Month}>Mês</SelectItem>
              <SelectItem value={ViewMode.Year}>Ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-auto border rounded-lg shadow-inner bg-background min-h-[500px]">
        <Gantt
          tasks={ganttTasks}
          viewMode={view}
          onDateChange={handleTaskChange}
          onProgressChange={handleProgressChange}
          onDoubleClick={handleDblClick}
          onExpanderClick={handleExpanderClick}
          listCellWidth="155px"
          columnWidth={view === ViewMode.Month ? 300 : 65}
          rowHeight={40}
          barFill={60}
          ganttHeight={500}
        />
      </div>
    </div>
  );
}
