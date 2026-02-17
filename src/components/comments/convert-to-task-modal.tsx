"use client";

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
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
import { createTaskFromComment } from "@/lib/firebase/tasks";
import { useAuth } from "@/hooks/use-auth";
import type { Comment, TaskStatus, TaskPriority } from "@/types/smart-note";
import { toast } from "sonner";
import { ClipboardList, User, Calendar, Flag } from "lucide-react";

interface ConvertToTaskModalProps {
  comment: Comment;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (taskId: string) => void;
}

export function ConvertToTaskModal({ 
  comment, 
  isOpen, 
  onClose,
  onSuccess 
}: ConvertToTaskModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState(comment.selection?.text || "Ação de comentário");
  const [description, setDescription] = useState(comment.content);
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [isLoading, setIsLoading] = useState(false);

  const handleConvert = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const taskId = await createTaskFromComment(user.uid, comment.id, {
        title,
        description,
        priority,
        status,
        documentId: comment.documentId,
      });

      toast.success("Comentário convertido em tarefa!");
      if (onSuccess) onSuccess(taskId);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao converter comentário.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] sm:rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ClipboardList className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Converter em Tarefa
            </span>
          </div>
          <DialogTitle className="text-2xl font-black tracking-tight">
            Nova Tarefa
          </DialogTitle>
          <DialogDescription>
            Defina os detalhes da tarefa baseada no comentário.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <label className="text-sm font-bold flex items-center gap-2">
              Título
            </label>
            <Input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Revisar parágrafo X"
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold flex items-center gap-2">
              Descrição
            </label>
            <Textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mais detalhes sobre a tarefa..."
              className="min-h-[100px] rounded-xl resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Flag className="w-3 h-3" /> Prioridade
              </label>
              <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                <SelectTrigger className="rounded-xl">
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

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <User className="w-3 h-3" /> Status
              </label>
              <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">Pendente</SelectItem>
                  <SelectItem value="in_progress">Em progresso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-between gap-4">
          <Button variant="ghost" onClick={onClose} className="font-bold">
            Cancelar
          </Button>
          <Button 
            onClick={handleConvert} 
            disabled={isLoading || !title.trim()}
            className="font-bold px-8 rounded-xl shadow-lg shadow-primary/20"
          >
            {isLoading ? "Criando..." : "Criar Tarefa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
