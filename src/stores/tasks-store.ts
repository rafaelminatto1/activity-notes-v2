import { create } from "zustand";

export type TaskStatus = "todo" | "in_progress" | "done" | "cancelled" | "archived";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  assigneeId?: string;
  completedAt?: Date;
  documentId?: string; // If embedded in a note
  userId: string;
  createdAt: Date;
  labels?: string[];
  subtasks?: Task[]; // For nested tasks
}

export interface TasksStore {
  tasks: Task[];
  filter: {
    status?: TaskStatus | "all";
    priority?: TaskPriority | "all";
    assignee?: string | "all";
    dueDate?: "all" | "overdue" | "today" | "this-week" | "next-week";
    searchQuery?: string;
  };
  selectedTaskId: string | null;
  isLoading: boolean;
  loadTasks: () => Promise<void>;
  createTask: (task: Partial<Task> & Pick<Task, "title">) => Promise<string>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  toggleTaskComplete: (taskId: string) => Promise<void>;
  clearFilter: (filter: keyof TasksStore["filter"]) => void;
}

export const useTasksStore = create<TasksStore>((set, get) => ({
  tasks: [],
  filter: { status: "all" },
  selectedTaskId: null,
  isLoading: false,
  loadTasks: async () => {
    set({ isLoading: true });

    try {
      const response = await fetch("/api/tasks");
      if (response.ok) {
        const tasks = await response.json();
        set({ tasks, isLoading: false });
      }
    } catch (error) {
      console.error("Failed to load tasks:", error);
      set({ isLoading: false });
    }
  },
  createTask: async (task) => {
    set({ isLoading: true });

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
      });

      if (response.ok) {
        const newTask = await response.json();
        set({ tasks: [...get().tasks, newTask], isLoading: false });
        return newTask.id;
      }
    } catch (error) {
      console.error("Failed to create task:", error);
      set({ isLoading: false });
      throw error;
    }
  },
  updateTask: async (taskId, updates) => {
    set({ isLoading: true });

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        set({
          tasks: get().tasks.map((t) =>
            t.id === taskId ? { ...t, ...updates } : t
          ),
          isLoading: false,
        });
      }
    } catch (error) {
      console.error("Failed to update task:", error);
      set({ isLoading: false });
      throw error;
    }
  },
  deleteTask: async (taskId) => {
    set({ isLoading: true });

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        set({
          tasks: get().tasks.filter((t) => t.id !== taskId),
          isLoading: false,
        });
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
      set({ isLoading: false });
      throw error;
    }
  },
  toggleTaskComplete: async (taskId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;

    const newStatus: TaskStatus =
      task.status === "done" ? "todo" : "done";

    await get().updateTask(taskId, { status: newStatus });
  },
  clearFilter: (filter) =>
    set((state) => ({
      filter: { ...state.filter, [filter]: "all" },
    })),
}));
