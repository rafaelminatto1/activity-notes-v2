"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Plus, 
  ArrowLeft, 
  Trophy, 
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { 
  subscribeToSprints, 
  subscribeToProjectTasks,
  assignTaskToSprint,
  updateTask,
  createSprint,
  completeSprint,
  updateSprint
} from "@/lib/firebase/tasks";
import { getProject } from "@/lib/firebase/projects";
import { Sprint, Project, SprintStatus } from "@/types/project";
import { Task, TaskStatus } from "@/types/smart-note";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SprintBoard } from "@/components/sprints/sprint-board";
import { SprintBacklog } from "@/components/sprints/sprint-backlog";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Timestamp } from "firebase/firestore";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

export default function SprintsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const router = useRouter();
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state for new sprint
  const [newSprint, setNewSprint] = useState({
    name: "",
    goal: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    if (!user || !projectId) return;

    // Load project details
    getProject(projectId).then(setProject);

    // Subscribe to sprints
    const unsubSprints = subscribeToSprints(projectId, (data) => {
      setSprints(data);
      setIsLoading(false);
    });

    // Subscribe to tasks
    const unsubTasks = subscribeToProjectTasks(user.uid, projectId, setTasks);

    return () => {
      unsubSprints();
      unsubTasks();
    };
  }, [user, projectId]);

  const activeSprint = useMemo(() => 
    sprints.find(s => s.status === "active"), 
  [sprints]);

  const handleCreateSprint = async () => {
    if (!user || !projectId) return;
    if (!newSprint.name || !newSprint.startDate || !newSprint.endDate) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    try {
      await createSprint({
        projectId,
        name: newSprint.name,
        goal: newSprint.goal,
        startDate: Timestamp.fromDate(new Date(newSprint.startDate)),
        endDate: Timestamp.fromDate(new Date(newSprint.endDate)),
        status: sprints.length === 0 ? "active" : "planned",
        userId: user.uid,
      });
      setIsModalOpen(false);
      setNewSprint({ name: "", goal: "", startDate: "", endDate: "" });
      toast.success("Sprint criado com sucesso!");
    } catch {
      toast.error("Erro ao criar sprint.");
    }
  };

  const handleAssignTaskToSprint = async (taskId: string, sprintId: string | null) => {
    try {
      await assignTaskToSprint(taskId, sprintId);
    } catch {
      toast.error("Erro ao mover tarefa.");
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: TaskStatus) => {
    try {
      const updates: Partial<Task> = { status };
      if (status === "done") {
        updates.completedAt = Timestamp.now();
      }
      await updateTask(taskId, updates);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Erro ao atualizar tarefa.";
      toast.error(msg);
    }
  };

  const handleCompleteSprint = async () => {
    if (!activeSprint) return;
    
    const confirm = window.confirm("Deseja finalizar este sprint? Tarefas inacabadas serão movidas para o próximo sprint ou para o backlog.");
    if (!confirm) return;

    try {
      const nextSprint = sprints.find(s => s.status === "planned");
      await completeSprint(activeSprint.id, nextSprint?.id);
      
      // If there's a next sprint, make it active
      if (nextSprint) {
        await updateSprint(nextSprint.id, { status: "active" as SprintStatus });
      }
      
      toast.success("Sprint finalizado!");
    } catch {
      toast.error("Erro ao finalizar sprint.");
    }
  };

  const onBacklogTabClick = useCallback(() => {
    const trigger = document.querySelector('[value="backlog"]') as HTMLButtonElement | null;
    if (trigger) trigger.click();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-6 space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/projects/${projectId}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{project?.name || "Projeto"}</h1>
              <span className="text-muted-foreground">/</span>
              <span className="text-muted-foreground">Sprints</span>
            </div>
            <p className="text-sm text-muted-foreground">Gerencie o progresso e o backlog do seu time.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push(`/projects/${projectId}`)}>
            Ver Documentos
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Novo Sprint
          </Button>
        </div>
      </div>

      <Tabs defaultValue={activeSprint ? "board" : "backlog"}>
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="board" disabled={!activeSprint}>Quadro do Sprint</TabsTrigger>
          <TabsTrigger value="backlog">Backlog</TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="mt-6">
          {activeSprint ? (
            <SprintBoard 
              sprint={activeSprint}
              tasks={tasks.filter(t => t.sprintId === activeSprint.id)}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onCompleteSprint={handleCompleteSprint}
            />
          ) : (
            <div className="text-center py-20 border-2 border-dashed rounded-2xl">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <h3 className="text-xl font-bold">Nenhum Sprint Ativo</h3>
              <p className="text-muted-foreground mt-2">Vá para o Backlog para iniciar um novo sprint.</p>
              <Button variant="outline" className="mt-6" onClick={onBacklogTabClick}>
                Ir para Backlog
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="backlog" className="mt-6">
          <SprintBacklog 
            tasks={tasks}
            sprints={sprints}
            onAssignToSprint={handleAssignTaskToSprint}
            onCreateSprint={() => setIsModalOpen(true)}
          />
        </TabsContent>
      </Tabs>

      {/* New Sprint Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Sprint</DialogTitle>
            <DialogDescription>Defina as metas e prazos para o próximo ciclo de trabalho.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Sprint</Label>
              <Input 
                id="name" 
                placeholder="Ex: Sprint 1, Ciclo de Janeiro..." 
                value={newSprint.name}
                onChange={(e) => setNewSprint({...newSprint, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal">Meta do Sprint</Label>
              <Textarea 
                id="goal" 
                placeholder="O que pretendemos alcançar?" 
                value={newSprint.goal}
                onChange={(e) => setNewSprint({...newSprint, goal: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start">Início</Label>
                <Input 
                  id="start" 
                  type="date" 
                  value={newSprint.startDate}
                  onChange={(e) => setNewSprint({...newSprint, startDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">Fim</Label>
                <Input 
                  id="end" 
                  type="date" 
                  value={newSprint.endDate}
                  onChange={(e) => setNewSprint({...newSprint, endDate: e.target.value})}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateSprint}>Criar Sprint</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
