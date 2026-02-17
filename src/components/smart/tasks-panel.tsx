"use client";

import { 
  Check, 
  Plus, 
  Trash2, 
  X, 
  Sparkles, 
  Filter as FilterIcon, 
  ChevronDown, 
  ChevronUp,
  Lock
} from "lucide-react";
import { useState, useEffect } from "react";
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
import { FilterBuilder } from "@/components/filters/filter-builder";
import { SavedViewsTabs } from "@/components/filters/saved-views-tabs";
import { saveView } from "@/lib/firebase/tasks";
import type { FilterGroup } from "@/types/view";
import { TaskModal } from "@/components/tasks/task-modal";
import { usePermission } from "@/hooks/use-permission";

interface TasksPanelProps {
  documentId?: string;
  isOpen: boolean;
  onClose: () => void;
  workspaceId?: string; // Add workspaceId prop
}

export function TasksPanel({ documentId, isOpen, onClose, workspaceId }: TasksPanelProps) {
  const { user } = useAuth();
  const { can } = usePermission(workspaceId);
  const { 
    tasks, 
    isLoading, 
    subscribe, 
    createTask, 
    toggleTaskComplete, 
    deleteTask,
    filter,
    setFilter,
    activeViewId
  } = useTasksStore();
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "document">("all");
  const [isExtracting, setIsExtracting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    if (user) {
      // Se estiver na aba "document", filtra por docId, senão carrega todas
      const filterDocId = activeTab === "document" ? documentId : undefined;
      subscribe(user.uid, filterDocId);
    }
  }, [user, documentId, activeTab, subscribe, filter.advanced]);

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

  const handleSaveView = async (filterGroup: FilterGroup) => {
    if (!user) return;
    const name = window.prompt("Nome da visualização:");
    if (!name) return;

    try {
      await saveView(user.uid, {
        name,
        type: "tasks",
        filters: filterGroup,
        sortBy: "createdAt",
        sortDir: "desc"
      });
      toast.success("Visualização salva!");
    } catch (error) {
      toast.error("Erro ao salvar visualização");
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

  const handleToggleTask = async (task: Task) => {
    const isBlocked = tasks
      .filter(t => task.blockedBy?.includes(t.id))
      .some(t => t.status !== "done" && t.status !== "cancelled");

    if (isBlocked && task.status !== "done") {
      toast.error("Esta tarefa está bloqueada por outras tarefas pendentes.");
      return;
    }

    try {
      await toggleTaskComplete(task);
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar tarefa");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-80 flex-col border-l bg-background shadow-lg transition-transform duration-300 ease-in-out">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="text-lg font-semibold">Tarefas</h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(showFilters && "bg-accent text-accent-foreground")}
            title="Filtros avançados"
          >
            <FilterIcon className="h-4 w-4" />
          </Button>
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

      {/* Advanced Filters */}
      {showFilters && (
        <div className="border-b bg-muted/20 animate-in slide-in-from-top duration-200">
          <FilterBuilder 
            initialFilter={filter.advanced}
            onChange={(adv) => setFilter({ advanced: adv })}
            onSave={handleSaveView}
          />
        </div>
      )}

      {/* Tabs / Saved Views */}
      <div className="px-4 py-2 bg-muted/10">
        {user && <SavedViewsTabs userId={user.uid} />}
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="w-full h-8">
            <TabsTrigger value="all" className="flex-1 text-xs">Coleção</TabsTrigger>
            <TabsTrigger value="document" className="flex-1 text-xs" disabled={!documentId}>
              Nota Atual
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Create Task Input */}
      <form onSubmit={handleCreateTask} className="px-4 py-2 border-b">
        <div className="flex gap-2">
          <Input
            placeholder={can("tasks", "create") ? "Nova tarefa..." : "Sem permissão para criar"}
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="flex-1"
            disabled={!can("tasks", "create")}
          />
          <Button type="submit" size="icon" disabled={!newTaskTitle.trim() || !can("tasks", "create")}>
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
            {tasks.map((task) => {
              const isBlocked = tasks
                .filter(t => task.blockedBy?.includes(t.id))
                .some(t => t.status !== "done" && t.status !== "cancelled");

              return (
                <TaskItem
                  key={task.id}
                  task={task}
                  isBlocked={isBlocked}
                  onToggle={() => can("tasks", "update") && handleToggleTask(task)}
                  onDelete={() => can("tasks", "delete") && deleteTask(task.id)}
                  onClick={() => setSelectedTask(task)}
                />
              );
            })}
          </div>
        )}
      </ScrollArea>

      <TaskModal 
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </div>
  );
}

function TaskItem({
  task,
  isBlocked,
  onToggle,
  onDelete,
  onClick,
}: {
  task: Task;
  isBlocked: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onClick: () => void;
}) {
  return (
    <div 
      className="group flex items-start gap-2 rounded-md p-2 hover:bg-accent transition-colors cursor-pointer"
      onClick={onClick}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={cn(
          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          task.status === "done" && "bg-primary text-primary-foreground",
          isBlocked && task.status !== "done" && "border-amber-500 bg-amber-500/10"
        )}
      >
        {task.status === "done" ? (
          <Check className="h-3 w-3" />
        ) : isBlocked ? (
          <Lock className="h-2.5 w-2.5 text-amber-600" />
        ) : null}
      </button>
      
      <span className={cn(
        "flex-1 text-sm break-words",
        task.status === "done" && "text-muted-foreground line-through",
        isBlocked && task.status !== "done" && "text-amber-700 dark:text-amber-400"
      )}>
        {task.title}
      </span>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
