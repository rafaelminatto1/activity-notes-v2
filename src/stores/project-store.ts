import { create } from 'zustand';
import type { Project, ProjectCreate, ProjectUpdate } from '@/types/project';
import {
  createProject,
  getProjects,
  updateProject,
  deleteProject,
  moveDocumentToProject,
} from '@/lib/firebase/projects';
import { useAuth } from '@/hooks/use-auth';
import { Timestamp } from 'firebase/firestore';

/**
 * Store para gerenciamento de projetos/pastas
 */
interface ProjectStore {
  // Estado
  projects: Project[];
  currentProject: Project | null;
  activeView: 'sidebar' | 'grid' | 'list';
  loading: boolean;
  error: string | null;

  // Ações
  setCurrentProject: (project: Project | null) => void;
  createProject: (data: ProjectCreate & { userId: string }) => Promise<string>;
  updateProject: (id: string, data: ProjectUpdate) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  moveDocumentToProject: (docId: string, projectId: string) => Promise<void>;
  toggleView: () => void;
  loadProjects: (userId?: string) => Promise<void>;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  // Estado inicial
  projects: [],
  currentProject: null,
  activeView: 'sidebar',
  loading: false,
  error: null,

  // Carregar projetos
  loadProjects: async (userId?: string) => {
    if (!userId) {
      set({ projects: [], loading: false, error: null });
      return;
    }
    set({ loading: true, error: null });
    try {
      const projects = await getProjects(userId);
      set({ projects, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Erro ao carregar projetos', loading: false });
    }
  },

  // Ações
  setCurrentProject: (project) => {
    set({ currentProject: project });
  },

  createProject: async (data) => {
    set({ loading: true, error: null });
    try {
      const projectId = await createProject(data);
      const now = Timestamp.now();
      set((state) => ({
        projects: [
          ...state.projects,
          {
            ...data,
            id: projectId,
            createdAt: now,
            updatedAt: now,
            documentCount: 0
          }
        ],
        loading: false
      }));
      return projectId;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Erro ao criar projeto', loading: false });
      throw err;
    }
  },

  updateProject: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await updateProject(id, data);
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? { ...p, ...data } : p)),
        loading: false,
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Erro ao atualizar projeto', loading: false });
      throw err;
    }
  },

  deleteProject: async (id) => {
    set({ loading: true, error: null });
    try {
      await deleteProject(id);
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        loading: false,
        currentProject: state.currentProject?.id === id ? null : state.currentProject,
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Erro ao excluir projeto', loading: false });
      throw err;
    }
  },

  moveDocumentToProject: async (docId, projectId) => {
    set({ loading: true, error: null });
    try {
      await moveDocumentToProject(docId, projectId);
      // Não recarregar aqui - será recarregado pelo usuário se necessário
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Erro ao mover documento', loading: false });
      throw err;
    }
  },

  toggleView: () => {
    set((state) => {
      const views: ('sidebar' | 'grid' | 'list')[] = ['sidebar', 'grid', 'list'];
      const currentIndex = views.indexOf(state.activeView);
      return { activeView: views[(currentIndex + 1) % views.length] };
    });
  },
}));
