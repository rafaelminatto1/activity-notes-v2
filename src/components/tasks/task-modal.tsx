"use client";

import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useTasksStore } from "@/stores/tasks-store";
import { useAuth } from "@/hooks/use-auth";
import type { Task, TaskStatus, TaskPriority } from "@/types/smart-note";
import { DependencySelector } from "./dependency-selector";
import { 
  Lock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  Target,
  Sparkles,
  MessageSquare,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { useTaskAI } from "@/hooks/use-task-ai";
import Link from "next/link";

interface TaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TaskModal({ task, isOpen, onClose }: TaskModalProps) {
  const { user: _user } = useAuth();
  const { tasks: allTasks, updateTask } = useTasksStore();
  const { autoFillTask, loading: aiLoading } = useTaskAI();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [storyPoints, setStoryPoints] = useState<number>(0);
  
  const [blockedBy, setBlockedBy] = useState<string[]>([]);
  const [blocking, setBlocking] = useState<string[]>([]);
  const [relatedTo, setRelatedTo] = useState<string[]>([]);

  useEffect(() => {
    if (task && isOpen) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setStatus(task.status || "todo");
      setPriority(task.priority || "medium");
      setStoryPoints(task.storyPoints || 0);
      setBlockedBy(task.blockedBy || []);
      setBlocking(task.blocking || []);
      setRelatedTo(task.relatedTo || []);
    }
  }, [task, isOpen]);

  const handleSave = async () => {
    if (!task) return;
    
    try {
      await updateTask(task.id, {
        title,
        description,
        status,
        priority,
        storyPoints,
        blockedBy,
        blocking,
        relatedTo,
      });
      toast.success("Tarefa atualizada");
      onClose();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Erro ao atualizar tarefa";
      toast.error(msg);
    }
  };

  if (!task) return null;

  const isBlocked = allTasks
    .filter(t => blockedBy.includes(t.id))
    .some(t => t.status !== "done" && t.status !== "cancelled");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={isBlocked ? "destructive" : "outline"} className="gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest">
              {isBlocked ? <Lock className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
              {isBlocked ? "Bloqueada" : "Livre"}
            </Badge>
            <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
              Detalhes da Tarefa
            </span>
            <div className="ml-auto">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 gap-1 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900/20"
                onClick={async () => {
                  const suggestions = await autoFillTask(title, description);
                  if (suggestions) {
                    if (suggestions.summary) setDescription(suggestions.summary);
                    if (suggestions.priority) setPriority(suggestions.priority);
                    // Tags logic would go here if we had tags field exposed
                  }
                }}
                disabled={aiLoading}
              >
                <Sparkles className="h-3 w-3" />
                {aiLoading ? "Pensando..." : "Preencher com IA"}
              </Button>
            </div>
          </div>
          <DialogTitle>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-bold border-transparent hover:border-border transition-all focus:border-primary px-0 h-auto"
            />
          </DialogTitle>
        </DialogHeader>

        {isBlocked && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 p-3 rounded-lg flex gap-3 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>
              Esta tarefa está bloqueada por tarefas pendentes. 
              Você não poderá concluí-la até que os bloqueios sejam removidos ou concluídos.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
          <div className="md:col-span-2 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Descrição
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Adicione mais detalhes..."
                className="min-h-[120px] resize-none"
              />
            </div>

            <div className="space-y-6 border-t pt-6">
              <DependencySelector
                allTasks={allTasks}
                currentTaskId={task.id}
                selectedIds={blockedBy}
                type="blockedBy"
                onSelect={(id) => setBlockedBy([...blockedBy, id])}
                onRemove={(id) => setBlockedBy(blockedBy.filter(x => x !== id))}
              />
              <DependencySelector
                allTasks={allTasks}
                currentTaskId={task.id}
                selectedIds={blocking}
                type="blocking"
                onSelect={(id) => setBlocking([...blocking, id])}
                onRemove={(id) => setBlocking(blocking.filter(x => x !== id))}
              />
              <DependencySelector
                allTasks={allTasks}
                currentTaskId={task.id}
                selectedIds={relatedTo}
                type="relatedTo"
                onSelect={(id) => setRelatedTo([...relatedTo, id])}
                onRemove={(id) => setRelatedTo(relatedTo.filter(x => x !== id))}
              />
            </div>
          </div>

          <div className="space-y-6 bg-muted/30 p-4 rounded-xl border border-border">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status</label>
                <Select value={status} onValueChange={(v: TaskStatus) => setStatus(v)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">Pendente</SelectItem>
                    <SelectItem value="in_progress">Em Progresso</SelectItem>
                    <SelectItem value="done">Concluído</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Prioridade</label>
                <Select value={priority} onValueChange={(v: TaskPriority) => setPriority(v)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pontos de Sprint</label>
                <div className="relative">
                  <Target className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input 
                    type="number" 
                    value={storyPoints} 
                    onChange={(e) => setStoryPoints(parseInt(e.target.value) || 0)}
                    className="h-9 pl-8"
                    min={0}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              {task.commentId && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3 text-primary">
                    <MessageSquare className="h-4 w-4" />
                    <span className="font-medium">Origem: Comentário</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                    <Link href={`/documents/${task.documentId}?comment=${task.commentId}`}>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Criada em: {task.createdAt?.toDate().toLocaleDateString()}</span>
              </div>
              {task.completedAt && (
                <div className="flex items-center gap-3 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Concluída em: {task.completedAt.toDate().toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar Alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
