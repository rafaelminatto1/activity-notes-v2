"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useTasksStore } from "@/stores/tasks-store";
import { useAuth } from "@/hooks/use-auth";
import { GanttChart } from "@/components/gantt/gantt-chart";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectGanttPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { user } = useAuth();
  const { tasks, isLoading, subscribe } = useTasksStore();

  useEffect(() => {
    if (user && projectId) {
      // Usando subscribe para atualizações em tempo real
      subscribe(user.uid, projectId);
    }
  }, [user, projectId, subscribe]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cronograma do Projeto</h1>
          <p className="text-muted-foreground">
            Visualize o progresso e as dependências das tarefas.
          </p>
        </div>
      </div>

      <div className="flex-1 bg-card rounded-xl border shadow-sm p-1 overflow-hidden">
        <GanttChart tasks={tasks} isLoading={isLoading} />
      </div>
    </div>
  );
}
