import { create } from "zustand";
import type { Task, TaskStatus, TaskPriority } from "@/types/smart-note";
import type { FilterGroup, SavedView } from "@/types/view";
import {
  createTask,
  updateTask,
  deleteTask,
  getTasks,
  subscribeToTasks,
} from "@/lib/firebase/tasks";
import { toast } from "sonner";

export interface TaskFilter {
  status?: TaskStatus | "all";
  priority?: TaskPriority | "all";
  assignee?: string | "all";
  dueDate?: "overdue" | "today" | "this-week" | "next-week" | "all";
  searchQuery?: string;
  advanced?: FilterGroup;
}

export interface TasksStore {
  tasks: Task[];
  isLoading: boolean;
  initialized: boolean;
  unsubscribe: (() => void) | null;
  filter: TaskFilter;
  
  // Views
  savedViews: SavedView[];
  activeViewId: string | null;

  // UI State
  isPanelOpen: boolean;
  togglePanel: () => void;
  openPanel: () => void;
  closePanel: () => void;

  // Ações
  loadTasks: (userId: string, documentId?: string) => Promise<void>;
  subscribe: (userId: string, documentId?: string) => void;
  createTask: (userId: string, task: Partial<Task>) => Promise<string>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  toggleTaskComplete: (task: Task) => Promise<void>;
  setFilter: (updates: Partial<TaskFilter>) => void;
  clearFilter: (key?: keyof TaskFilter) => void;
  
  // View Actions
  setSavedViews: (views: SavedView[]) => void;
  setActiveView: (viewId: string | null) => void;
  applyView: (view: SavedView) => void;
}

export const useTasksStore = create<TasksStore>((set, get) => ({
  tasks: [],
  isLoading: false,
  initialized: false,
  unsubscribe: null,
  filter: {},
  
  savedViews: [],
  activeViewId: "all",

  isPanelOpen: false,
  togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),
  openPanel: () => set({ isPanelOpen: true }),
  closePanel: () => set({ isPanelOpen: false }),

  loadTasks: async (userId, documentId) => {
    set({ isLoading: true });
    try {
      const tasks = await getTasks(userId, documentId);
      set({ tasks, isLoading: false, initialized: true });
    } catch (error) {
      console.error("Failed to load tasks:", error);
      set({ isLoading: false });
      toast.error("Erro ao carregar tarefas");
    }
  },

  subscribe: (userId, documentId) => {
    const currentUnsub = get().unsubscribe;
    if (currentUnsub) currentUnsub();

    set({ isLoading: true });

    const unsub = subscribeToTasks(userId, documentId, (tasks) => {
      set({ tasks, isLoading: false, initialized: true });
    }, get().filter.advanced);

    set({ unsubscribe: unsub });
  },

  createTask: async (userId, task) => {
    // Optimistic update
    const tempId = Math.random().toString(36).substring(7);
    // const optimisticTask = { ...task, id: tempId, userId } as Task;

    try {
      const id = await createTask(userId, task);
      toast.success("Tarefa criada");
      return id;
    } catch (error) {
      console.error("Failed to create task:", error);
      toast.error("Erro ao criar tarefa");
      throw error;
    }
  },

  updateTask: async (taskId, updates) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
    }));

    try {
      await updateTask(taskId, updates);
    } catch (error) {
      console.error("Failed to update task:", error);
      toast.error("Erro ao atualizar tarefa");
    }
  },

  deleteTask: async (taskId) => {
    const previousTasks = get().tasks;
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== taskId),
    }));

    try {
      await deleteTask(taskId);
      toast.success("Tarefa excluída");
    } catch (error) {
      console.error("Failed to delete task:", error);
      toast.error("Erro ao excluir tarefa");
      set({ tasks: previousTasks });
    }
  },

  toggleTaskComplete: async (task) => {
    const newStatus = task.status === "done" ? "todo" : "done";
    await get().updateTask(task.id, { status: newStatus });
  },

  setFilter: (updates) =>
    set((state) => ({ filter: { ...state.filter, ...updates } })),

  clearFilter: (key) =>
    set((state) => ({
      filter: key
        ? { ...state.filter, [key]: undefined }
        : {},
    })),

  setSavedViews: (savedViews) => set({ savedViews }),
  
  setActiveView: (activeViewId) => set({ activeViewId }),
  
  applyView: (view) => {
    set({
      activeViewId: view.id,
      filter: {
        advanced: view.filters
      }
    });
  }
}));
