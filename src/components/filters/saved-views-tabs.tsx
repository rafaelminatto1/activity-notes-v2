"use client";

import { useEffect } from "react";
import { Plus, X } from "lucide-react";
import { useTasksStore } from "@/stores/tasks-store";
import { Button } from "@/components/ui/button";
import { subscribeToViews, deleteView } from "@/lib/firebase/tasks";
import type { FilterGroup } from "@/types/view";
import { toast } from "sonner";

interface SavedViewsTabsProps {
  userId: string;
}

export function SavedViewsTabs({ userId }: SavedViewsTabsProps) {
  const { 
    savedViews, 
    activeViewId, 
    setActiveView, 
    setSavedViews,
    applyView,
    clearFilter,
    setFilter
  } = useTasksStore();

  useEffect(() => {
    if (!userId) return;
    
    const unsub = subscribeToViews(userId, (views) => {
      setSavedViews(views);
    });
    
    return () => unsub();
  }, [userId, setSavedViews]);

  const defaultViews: { id: string; name: string; icon: string; filters?: FilterGroup }[] = [
    { id: "all", name: "Todas", icon: "📋" },
    { 
      id: "my-tasks", 
      name: "Minhas", 
      icon: "👤",
      filters: {
        id: "my-tasks",
        logic: "AND",
        rules: [{ id: "r1", field: "assigneeId", operator: "equals", value: userId }]
      }
    },
    { 
      id: "urgent", 
      name: "Urgentes", 
      icon: "🔥",
      filters: {
        id: "urgent",
        logic: "AND",
        rules: [{ id: "r1", field: "priority", operator: "equals", value: "urgent" }]
      }
    },
    { 
      id: "overdue", 
      name: "Vencidas", 
      icon: "⏰",
      filters: {
        id: "overdue",
        logic: "AND",
        rules: [
          { id: "r1", field: "dueDate", operator: "before", value: new Date() },
          { id: "r2", field: "status", operator: "not_equals", value: "done" }
        ]
      }
    },
  ];

  const handleSelectDefault = (view: typeof defaultViews[0]) => {
    setActiveView(view.id);
    if (view.filters) {
      setFilter({ advanced: view.filters });
    } else {
      clearFilter("advanced");
    }
  };

  const handleDeleteView = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteView(id);
      toast.success("Visualização excluída");
    } catch {
      toast.error("Erro ao excluir visualização");
    }
  };

  return (
    <div className="flex items-center gap-1 border-b border-border mb-4 overflow-x-auto no-scrollbar pb-px">
      {defaultViews.map((view) => (
        <button
          key={view.id}
          onClick={() => handleSelectDefault(view)}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all relative min-w-fit
            ${activeViewId === view.id 
              ? "text-primary border-b-2 border-primary" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
        >
          <span>{view.icon}</span>
          {view.name}
        </button>
      ))}

      <div className="h-4 w-px bg-border mx-2" />

      {savedViews.map((view) => (
        <button
          key={view.id}
          onClick={() => applyView(view)}
          className={`group flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all relative min-w-fit
            ${activeViewId === view.id 
              ? "text-primary border-b-2 border-primary" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
        >
          {view.icon && <span>{view.icon}</span>}
          {view.name}
          
          <X 
            className="h-3 w-3 opacity-0 group-hover:opacity-50 hover:opacity-100 transition-opacity ml-1"
            onClick={(e) => handleDeleteView(e, view.id)}
          />
        </button>
      ))}

      <Button variant="ghost" size="icon" className="h-8 w-8 ml-2 text-muted-foreground">
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
