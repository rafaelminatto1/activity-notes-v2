import { create } from 'zustand';
import { Project, ProjectCreate, ProjectUpdate } from '@/types/project';
import {
  createProject,
  updateProject,
  deleteProject,
  subscribeToUserProjects,
  moveDocumentToProject
} from '@/lib/firebase/projects';
import { toast } from 'sonner';

interface ProjectState {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  activeProjectId: string | null; // For filtering view

  // Actions
  unsubscribe: (() => void) | null;

  // Actions
  initSubscription: (userId: string) => void;
  cleanupSubscription: () => void;
  createProject: (data: ProjectCreate) => Promise<string>;
  updateProject: (id: string, data: ProjectUpdate) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  selectProject: (id: string | null) => void;
  moveDocumentToProject: (docId: string, projectId: string | null) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  isLoading: false,
  error: null,
  activeProjectId: null,
  unsubscribe: null,

  initSubscription: (userId: string) => {
    // Clean up previous subscription if exists
    const currentUnsubscribe = get().unsubscribe;
    if (currentUnsubscribe) {
      currentUnsubscribe();
    }

    set({ isLoading: true, error: null });

    try {
      const unsubscribe = subscribeToUserProjects(userId, (projects) => {
        set({ projects, isLoading: false });
      });
      set({ unsubscribe });
    } catch (error) {
      console.error(error);
      set({ error: 'Failed to subscribe to projects', isLoading: false });
      toast.error('Erro ao conectar com projetos');
    }
  },

  cleanupSubscription: () => {
    const unsubscribe = get().unsubscribe;
    if (unsubscribe) {
      unsubscribe();
      set({ unsubscribe: null });
    }
  },

  createProject: async (data: ProjectCreate) => {
    set({ isLoading: true });
    try {
      const id = await createProject(data);
      // No need to manually update state, the listener will catch it
      toast.success('Projeto criado com sucesso!');
      return id;
    } catch (error) {
      console.error(error);
      set({ error: 'Failed to create project', isLoading: false });
      toast.error('Erro ao criar projeto');
      throw error;
    }
  },

  updateProject: async (id: string, data: ProjectUpdate) => {
    try {
      await updateProject(id, data);
      toast.success('Projeto atualizado');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao atualizar projeto');
    }
  },

  deleteProject: async (id: string) => {
    try {
      await deleteProject(id);
      toast.success('Projeto excluído');
      // If deleted active project, clear selection
      if (get().activeProjectId === id) {
        set({ activeProjectId: null });
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao excluir projeto');
    }
  },

  selectProject: (id: string | null) => {
    set({ activeProjectId: id });
  },

  moveDocumentToProject: async (docId: string, projectId: string | null) => {
    try {
      await moveDocumentToProject(docId, projectId);
      toast.success('Documento movido');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao mover documento');
    }
  }
}));
