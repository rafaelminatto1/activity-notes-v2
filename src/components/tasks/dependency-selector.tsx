"use client";

import { useState, useMemo } from "react";
import { Check, Search, Link2, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { Task } from "@/types/smart-note";

interface DependencySelectorProps {
  allTasks: Task[];
  currentTaskId: string;
  selectedIds: string[];
  onSelect: (taskId: string) => void;
  onRemove: (taskId: string) => void;
  type: "blocking" | "blockedBy" | "relatedTo";
}

const typeConfig = {
  blocking: {
    label: "Bloqueia",
    description: "Esta tarefa impede que as selecionadas sejam concluídas.",
    icon: Link2,
    color: "text-blue-500",
  },
  blockedBy: {
    label: "Bloqueada por",
    description: "Estas tarefas devem ser concluídas antes desta.",
    icon: AlertCircle,
    color: "text-amber-500",
  },
  relatedTo: {
    label: "Relacionada a",
    description: "Tarefas que têm alguma relação com esta.",
    icon: Link2,
    color: "text-muted-foreground",
  },
};

export function DependencySelector({
  allTasks,
  currentTaskId,
  selectedIds,
  onSelect,
  onRemove,
  type,
}: DependencySelectorProps) {
  const [search, setSearch] = useState("");
  const config = typeConfig[type];

  const filteredTasks = useMemo(() => {
    return allTasks.filter(
      (t) =>
        t.id !== currentTaskId &&
        !selectedIds.includes(t.id) &&
        t.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [allTasks, currentTaskId, selectedIds, search]);

  const selectedTasks = useMemo(() => {
    return allTasks.filter((t) => selectedIds.includes(t.id));
  }, [allTasks, selectedIds]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold flex items-center gap-2">
          <config.icon className={cn("h-4 w-4", config.color)} />
          {config.label}
        </label>
        <p className="text-xs text-muted-foreground">{config.description}</p>
      </div>

      {/* Selected Items */}
      {selectedTasks.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTasks.map((task) => (
            <Badge
              key={task.id}
              variant="secondary"
              className="pl-2 pr-1 py-1 flex items-center gap-1"
            >
              <span className="max-w-[150px] truncate">{task.title}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 rounded-full hover:bg-muted-foreground/20"
                onClick={() => onRemove(task.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search & List */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tarefa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        {search && (
          <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-md max-h-[200px] overflow-hidden flex flex-col">
            <ScrollArea className="flex-1">
              <div className="p-1">
                {filteredTasks.length === 0 ? (
                  <div className="p-2 text-xs text-center text-muted-foreground">
                    Nenhuma tarefa encontrada
                  </div>
                ) : (
                  filteredTasks.map((task) => (
                    <button
                      key={task.id}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-left hover:bg-accent rounded-sm transition-colors"
                      onClick={() => {
                        onSelect(task.id);
                        setSearch("");
                      }}
                    >
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        task.status === "done" ? "bg-green-500" : "bg-muted-foreground/30"
                      )} />
                      <span className="flex-1 truncate">{task.title}</span>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}
