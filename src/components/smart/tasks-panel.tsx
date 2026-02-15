"use client";

import { useState, useEffect } from "react";
import { Check, Plus, Trash2, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTasksStore } from "@/stores/tasks-store";
import type { Task } from "@/types/smart-note";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { getDocument } from "@/lib/firebase/firestore";
import { extractTasksFromContent } from "@/lib/gemini/tasks";

interface TasksPanelProps {
  documentId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function TasksPanel({ documentId, isOpen, onClose }: TasksPanelProps) {
  const { user } = useAuth();
  const { tasks, isLoading, subscribe, createTask, toggleTaskComplete, deleteTask } = useTasksStore();
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "document">("all");
  const [isExtracting, setIsExtracting] = useState(false);

  useEffect(() => {
    if (user) {
      // Se estiver na aba "document", filtra por docId, senão carrega todas
      const filterDocId = activeTab === "document" ? documentId : undefined;
      subscribe(user.uid, filterDocId);
    }
  }, [user, documentId, activeTab, subscribe]);

  // Se mudar de aba para "document" e não tiver documentId (dashboard), voltar para "all"
  useEffect(() => {
    if (activeTab === "document" && !documentId) {
      setActiveTab("all");
    }
  }, [documentId, activeTab]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !user) return;

    try {
      await createTask(user.uid, {
        title: newTaskTitle.trim(),
        documentId: activeTab === "document" ? documentId : undefined,
      });
      setNewTaskTitle("");
    } catch (error) {
      // Error handled in store
    }
  };

  const handleExtractTasks = async () => {
    if (!documentId || !user) return;
    setIsExtracting(true);
    try {
      const doc = await getDocument(documentId);
      if (!doc || !doc.plainText) {
        toast.error("Documento vazio ou não encontrado.");
        setIsExtracting(false);
        return;
      }

      const extractedTasks = await extractTasksFromContent(doc.plainText);
      
      if (extractedTasks.length === 0) {
        toast.info("Nenhuma tarefa encontrada pelo Gemini.");
      } else {
        let count = 0;
        for (const title of extractedTasks) {
          await createTask(user.uid, {
            title,
            documentId,
            status: "todo",
          });
          count++;
        }
        toast.success(`${count} tarefas extraídas com sucesso!`);
        // Switch to document tab to see them
        setActiveTab("document");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao extrair tarefas.");
    } finally {
      setIsExtracting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-80 flex-col border-l bg-background shadow-lg transition-transform duration-300 ease-in-out">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="text-lg font-semibold">Tarefas</h2>
        <div className="flex items-center gap-1">
          {documentId && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleExtractTasks}
              disabled={isExtracting}
              title="Extrair tarefas com IA"
            >
              <Sparkles className={cn("h-4 w-4 text-purple-500", isExtracting && "animate-pulse")} />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 py-2">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">Todas</TabsTrigger>
            <TabsTrigger value="document" className="flex-1" disabled={!documentId}>
              Desta Nota
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Create Task Input */}
      <form onSubmit={handleCreateTask} className="px-4 py-2 border-b">
        <div className="flex gap-2">
          <Input
            placeholder="Nova tarefa..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!newTaskTitle.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </form>

      {/* Task List */}
      <ScrollArea className="flex-1 px-4 py-2">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <p className="text-sm">Nenhuma tarefa encontrada</p>
          </div>
        ) : (
          <div className="space-y-1">
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={() => toggleTaskComplete(task)}
                onDelete={() => deleteTask(task.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function TaskItem({
  task,
  onToggle,
  onDelete,
}: {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group flex items-start gap-2 rounded-md p-2 hover:bg-accent transition-colors">
      <button
        onClick={onToggle}
        className={cn(
          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          task.status === "done" && "bg-primary text-primary-foreground"
        )}
      >
        {task.status === "done" && <Check className="h-3 w-3" />}
      </button>
      
      <span className={cn(
        "flex-1 text-sm break-words",
        task.status === "done" && "text-muted-foreground line-through"
      )}>
        {task.title}
      </span>

      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
