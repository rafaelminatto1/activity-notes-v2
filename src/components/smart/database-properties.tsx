"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Tag, X, Calendar, User, Plus, Trash2, Star, Circle } from "lucide-react";

interface DatabasePropertiesProps {
  documentId: string;
  tags?: string[];
  status?: "todo" | "in_progress" | "done" | "archived" | "cancelled";
  priority?: "low" | "medium" | "high" | "urgent";
  dueDate?: Date;
  assigneeId?: string;
  onTagsChange?: (tags: string[]) => void;
  onStatusChange?: (status: string) => void;
  onPriorityChange?: (priority: string) => void;
  onDueDateChange?: (date: Date | null) => void;
  onAssigneeChange?: (assigneeId: string | null) => void;
}

const STATUSES = [
  { value: "todo", label: "A fazer", icon: <Circle size={16} /> },
  { value: "in_progress", label: "Em andamento", icon: <Plus size={16} /> },
  { value: "done", label: "Concluído", icon: <Star size={16} /> },
  { value: "archived", label: "Arquivado", icon: <Trash2 size={16} /> },
  { value: "cancelled", label: "Cancelado", icon: <X size={16} /> },
] as const;

const PRIORITIES = [
  { value: "low", label: "Baixa", color: "text-gray-500" },
  { value: "medium", label: "Média", color: "text-blue-500" },
  { value: "high", label: "Alta", color: "text-orange-500" },
  { value: "urgent", label: "Urgente", color: "text-red-500" },
] as const;

export function DatabaseProperties({
  documentId,
  tags: initialTags = [],
  status = "todo",
  priority = "low",
  dueDate,
  assigneeId,
  onTagsChange,
  onStatusChange,
  onPriorityChange,
  onDueDateChange,
  onAssigneeChange,
}: DatabasePropertiesProps) {
  const [localTags, setLocalTags] = useState<string[]>(initialTags);
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);

  // Load user's tags for autocomplete
  useEffect(() => {
    if (initialTags.length === 0) {
      loadUserTags();
    }
  }, [documentId]);

  const loadUserTags = async () => {
    try {
      const response = await fetch("/api/tags");
      if (response.ok) {
        const userTags = await response.json();
        setLocalTags(userTags);
      }
    } catch (error) {
      console.error("Failed to load tags:", error);
    }
  };

  const handleToggleTag = useCallback((tag: string) => {
    if (localTags.includes(tag)) {
      setLocalTags(localTags.filter((t) => t !== tag));
      onTagsChange?.(localTags.filter((t) => t !== tag));
    } else {
      setLocalTags([...localTags, tag]);
      onTagsChange?.([...localTags, tag]);
    }
  }, [localTags, onTagsChange]);

  const handleStatusChange = useCallback((newStatus: string) => {
    onStatusChange?.(newStatus);
  }, [onStatusChange]);

  const handlePriorityChange = useCallback((newPriority: string) => {
    onPriorityChange?.(newPriority);
  }, [onPriorityChange]);

  const handleDueDateChange = useCallback((newDate: Date | null) => {
    onDueDateChange?.(newDate);
  }, [onDueDateChange]);

  const handleAssigneeChange = useCallback((newAssigneeId: string | null) => {
    onAssigneeChange?.(newAssigneeId);
  }, [onAssigneeChange]);

  return (
    <div className="flex flex-wrap gap-2 p-2 text-sm border-b bg-muted/50">
      {/* Tags */}
      <div className="flex items-center gap-2">
        <Tag size={18} className="text-muted-foreground" />
        <button
          onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted"
        >
          {localTags.length > 0 ? (
            <span className="text-xs">{localTags.length}</span>
          ) : (
            <span className="text-xs">Adicionar tags</span>
          )}
          <Plus size={14} />
        </button>

        {isTagDropdownOpen && (
          <div className="absolute top-full left-full mt-1 bg-popover p-4 rounded-lg shadow-lg border w-64 z-50">
            <div className="text-xs font-semibold mb-2 text-muted-foreground">
              Tags do documento
            </div>
            <div className="space-y-1">
              {localTags.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Usando</div>
                  {localTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleToggleTag(tag)}
                      className="flex items-center justify-between w-full px-2 py-1 text-sm hover:bg-muted rounded-md transition-colors"
                    >
                      <span>{tag}</span>
                      <X size={14} className="text-muted-foreground hover:text-destructive" />
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-2 pt-2 border-t">
                <div className="text-xs text-muted-foreground mb-2">Criar nova tag</div>
                <input
                  type="text"
                  placeholder="Nova tag..."
                  className="w-full px-2 py-1 text-sm bg-background border rounded-md focus:outline-none focus:ring-2"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      const newTag = e.currentTarget.value.trim();
                      if (newTag) {
                        handleToggleTag(newTag);
                        e.currentTarget.value = "";
                        setIsTagDropdownOpen(false);
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status */}
      <div className="flex items-center gap-2">
        <div className="text-muted-foreground">
          <Calendar size={18} />
        </div>
        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="bg-background border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              <div className="flex items-center gap-2">
                {s.icon}
                <span>{s.label}</span>
              </div>
            </option>
          ))}
        </select>
      </div>

      {/* Priority */}
      <div className="flex items-center gap-2">
        <div className="text-muted-foreground">
          <Trash2 size={18} />
        </div>
        <select
          value={priority}
          onChange={(e) => handlePriorityChange(e.target.value)}
          className="bg-background border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2"
        >
          {PRIORITIES.map((p) => (
            <option key={p.value} value={p.value}>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: p.color }}
                />
                <span>{p.label}</span>
              </div>
            </option>
          ))}
        </select>
      </div>

      {/* Due Date */}
      <div className="flex items-center gap-2">
        <div className="text-muted-foreground">
          <Calendar size={18} />
        </div>
        <input
          type="date"
          value={dueDate ? new Date(dueDate).toISOString().split('T')[0] : ""}
          onChange={(e) => handleDueDateChange(e.target.valueAsDate || null)}
          className="bg-background border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2"
        />
      </div>

      {/* Assignee */}
      {assigneeId !== undefined && (
        <div className="flex items-center gap-2">
          <div className="text-muted-foreground">
            <User size={18} />
          </div>
          <select
            value={assigneeId || ""}
            onChange={(e) => handleAssigneeChange(e.target.value || null)}
            className="bg-background border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2"
          >
            <option value="">Não atribuído</option>
            {/* TODO: Load workspace members */}
          </select>
        </div>
      )}
    </div>
  );
}
