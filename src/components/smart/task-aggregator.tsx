"use client";

import React, { useEffect, useCallback, useMemo } from "react";
import { useTasksStore, type TaskStatus, type TaskPriority } from "@/stores/tasks-store";
import { CheckSquare, Circle, Plus, Filter, Calendar, Trash2, X, User, MoreVertical, Clock, AlertCircle } from "lucide-react";

export function TaskAggregator() {
  const { tasks, filter, isLoading, createTask, updateTask, deleteTask, toggleTaskComplete, clearFilter, loadTasks } = useTasksStore();

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Filter by status
    if (filter.status && filter.status !== "all") {
      filtered = filtered.filter((t) => t.status === filter.status);
    }

    // Filter by priority
    if (filter.priority && filter.priority !== "all") {
      filtered = filtered.filter((t) => t.priority === filter.priority);
    }

    // Filter by assignee
    if (filter.assignee && filter.assignee !== "all") {
      filtered = filtered.filter((t) => t.assigneeId === filter.assignee);
    }

    // Filter by due date
    if (filter.dueDate) {
      const now = new Date();
      filtered = filtered.filter((t) => {
        if (!t.dueDate) return false;

        switch (filter.dueDate) {
          case "overdue":
            return new Date(t.dueDate) < now;
          case "today":
            return t.dueDate.toDateString() === now.toDateString();
          case "this-week":
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            const taskDate = new Date(t.dueDate);
            return taskDate >= weekStart && taskDate <= weekEnd;
          case "next-week":
            const nextWeekStart = new Date(now);
            nextWeekStart.setDate(now.getDate() + 7);
            const nextWeekEnd = new Date(nextWeekStart);
            nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
            const taskDate2 = new Date(t.dueDate);
            return taskDate2 >= nextWeekStart && taskDate2 <= nextWeekEnd;
          default:
            return true;
        }
      });
    }

    // Search filter
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      filtered = filtered.filter((t) =>
        t.title.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [tasks, filter]);

  const handleClearFilter = useCallback((filterKey: keyof typeof filter) => {
    clearFilter(filterKey);
  }, [clearFilter]);

  const handleClearAllFilters = useCallback(() => {
    clearFilter("status");
    clearFilter("priority");
    clearFilter("assignee");
    clearFilter("dueDate");
    clearFilter("searchQuery");
  }, [clearFilter]);

  // Count tasks by status
  const todoCount = filteredTasks.filter((t) => t.status === "todo").length;
  const inProgressCount = filteredTasks.filter((t) => t.status === "in_progress").length;
  const doneCount = filteredTasks.filter((t) => t.status === "done").length;
  const overdueCount = filteredTasks.filter((t) =>
    t.status !== "done" && t.status !== "cancelled" && t.status !== "archived" && t.dueDate && new Date(t.dueDate) < new Date()
  ).length;

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
        <div>
          <h1 className="text-2xl font-bold">Tarefas</h1>
          <p className="text-sm text-muted-foreground">
            {filteredTasks.length} {filteredTasks.length === 1 ? "tarefa" : "tarefas"}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <CheckSquare className="text-muted-foreground" />
            <span className="text-muted-foreground">{doneCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <Circle className="text-muted-foreground" />
            <span className="text-muted-foreground">{inProgressCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="text-red-500" />
            <span className="text-red-500">{overdueCount}</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 p-3 border-b bg-card">
        {/* Status Filter */}
        <div className="relative">
          <Filter size={18} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <select
            value={filter.status || "all"}
            onChange={(e) => {
              const value = e.target.value === "all" ? undefined : e.target.value as TaskStatus | undefined;
              clearFilter("status");
            }}
            className="bg-background border rounded-md pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 appearance-none cursor-pointer"
          >
            <option value="all">Todos os Status</option>
            <option value="todo">A Fazer</option>
            <option value="in_progress">Em Andamento</option>
            <option value="done">Concluídas</option>
            <option value="cancelled">Canceladas</option>
            <option value="archived">Arquivadas</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div className="relative">
          <AlertCircle size={18} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <select
            value={filter.priority || "all"}
            onChange={(e) => {
              const value = e.target.value === "all" ? undefined : e.target.value as TaskPriority | undefined;
              clearFilter("priority");
            }}
            className="bg-background border rounded-md pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 appearance-none cursor-pointer"
          >
            <option value="all">Todas as Prioridades</option>
            <option value="urgent">Urgentes</option>
            <option value="high">Altas</option>
            <option value="medium">Médias</option>
            <option value="low">Baixas</option>
          </select>
        </div>

        {/* Due Date Filter */}
        <div className="relative">
          <Calendar size={18} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <select
            value={filter.dueDate || "all"}
            onChange={(e) => {
              const value = e.target.value === "all" ? undefined : e.target.value as "overdue" | "today" | "this-week" | "next-week" | undefined;
              clearFilter("dueDate");
            }}
            className="bg-background border rounded-md pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 appearance-none cursor-pointer"
          >
            <option value="all">Todas as Datas</option>
            <option value="overdue">Atrasadas</option>
            <option value="today">Hoje</option>
            <option value="this-week">Esta Semana</option>
            <option value="next-week">Próxima Semana</option>
          </select>
        </div>

        {/* Search */}
        <div className="flex-1 relative">
          <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar tarefas..."
            value={filter.searchQuery || ""}
            onChange={(e) => {
              // Update search query in store
              (window as any).tasksSearchQuery = e.target.value;
              clearFilter("searchQuery");
            }}
            className="w-full bg-background border rounded-md pl-10 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2"
          />
        </div>

        {/* Clear Filters */}
        <button
          onClick={handleClearAllFilters}
          className="px-3 py-1.5 bg-secondary text-secondary-foreground text-sm rounded-md hover:bg-secondary/80"
        >
          Limpar
        </button>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Plus size={48} className="mx-auto mb-2 text-muted-foreground" />
            <p>Nenhuma tarefa encontrada</p>
            <button
              onClick={() => createTask({ title: "Nova tarefa" })}
              className="mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
            >
              Criar Tarefa
            </button>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                task.status === "done"
                  ? "bg-muted/30 border-muted hover:bg-muted"
                  : task.status === "cancelled"
                  ? "bg-muted/10 border-muted hover:bg-muted opacity-50"
                  : "bg-card border-card hover:border-muted"
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleTaskComplete(task.id)}
                  className="flex-shrink-0 mt-1"
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      task.status === "done"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-transparent text-muted-foreground border-muted-foreground"
                    }`}
                  >
                    {task.status === "done" && <CheckSquare size={14} />}
                  </div>
                </button>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className={`font-semibold ${
                      task.status === "done" ? "line-through text-muted-foreground" : "text-foreground"
                    }`}>{task.title}</p>
                    {task.priority && (
                      <div
                        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          task.priority === "urgent"
                            ? "bg-red-500"
                            : task.priority === "high"
                            ? "bg-orange-500"
                            : task.priority === "medium"
                            ? "bg-blue-500"
                            : "bg-gray-500"
                        }`}
                      />
                    )}
                  </div>
                  {task.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                  )}
                  {task.dueDate && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar size={12} />
                      {new Date(task.dueDate).toLocaleDateString("pt-BR")}
                    </div>
                  )}
                  {task.labels && task.labels.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      {task.labels.map((label, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {task.assigneeId && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <User size={12} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Atribuído</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 ml-8 mt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTask(task.id);
                  }}
                  className="p-1 bg-destructive/10 text-destructive rounded-md hover:bg-destructive/20"
                  title="Excluir tarefa"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
