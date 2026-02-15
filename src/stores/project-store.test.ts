import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useProjectStore } from './project-store';

// Mock types
import type { Project } from '@/types/project';

// Mock dependencies
vi.mock('@/lib/firebase/projects', () => ({
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  moveDocumentToProject: vi.fn(),
  subscribeToUserProjects: vi.fn(),
  getProjects: vi.fn(), // If used
}));

// Import mocked functions to assert calls
import {
  createProject,
  updateProject,
  deleteProject,
  moveDocumentToProject,
  subscribeToUserProjects,
} from '@/lib/firebase/projects';

const mockProject: Project = {
  id: 'proj-1',
  name: 'Test Project',
  icon: '📁',
  color: '#000000',
  userId: 'user-1',
  createdAt: { seconds: 100, nanoseconds: 0 } as any,
  updatedAt: { seconds: 100, nanoseconds: 0 } as any,
  documentCount: 0,
};

describe('Project Store', () => {
  beforeEach(() => {
    // Reset store state
    useProjectStore.setState({
      projects: [],
      isLoading: false,
      error: null,
      activeProjectId: null,
      unsubscribe: null,
    });
    vi.clearAllMocks();
  });

  it('should have initial state', () => {
    const state = useProjectStore.getState();
    expect(state.projects).toEqual([]);
    expect(state.isLoading).toBe(false);
  });

  it('should subscribe to projects', () => {
    const mockUnsub = vi.fn();
    (subscribeToUserProjects as any).mockReturnValue(mockUnsub);

    useProjectStore.getState().initSubscription('user-1');

    const state = useProjectStore.getState();
    expect(state.isLoading).toBe(true);
    expect(subscribeToUserProjects).toHaveBeenCalledWith('user-1', expect.any(Function));
    expect(state.unsubscribe).toBe(mockUnsub);
  });

  it('should cleanup subscription', () => {
    const mockUnsub = vi.fn();
    useProjectStore.setState({ unsubscribe: mockUnsub });

    useProjectStore.getState().cleanupSubscription();

    expect(mockUnsub).toHaveBeenCalled();
    expect(useProjectStore.getState().unsubscribe).toBeNull();
  });

  it('should create project', async () => {
    const newProjectData = { name: 'New Project', icon: '✨', color: '#ffffff', userId: 'user-1' };
    (createProject as any).mockResolvedValue('new-id');

    await useProjectStore.getState().createProject(newProjectData);

    const state = useProjectStore.getState();
    expect(createProject).toHaveBeenCalledWith(newProjectData);
    // State update is handled by subscription, not optimistically in this version of store
  });

  it('should update project', async () => {
    await useProjectStore.getState().updateProject('proj-1', { name: 'Updated' });
    expect(updateProject).toHaveBeenCalledWith('proj-1', { name: 'Updated' });
  });

  it('should delete project', async () => {
    useProjectStore.setState({ projects: [mockProject], activeProjectId: 'proj-1' });

    await useProjectStore.getState().deleteProject('proj-1');

    const state = useProjectStore.getState();
    expect(deleteProject).toHaveBeenCalledWith('proj-1');
    expect(state.activeProjectId).toBeNull();
  });

  it('should move document to project', async () => {
    await useProjectStore.getState().moveDocumentToProject('doc-1', 'proj-1');
    expect(moveDocumentToProject).toHaveBeenCalledWith('doc-1', 'proj-1');
  });

  it('should select project', () => {
    useProjectStore.getState().selectProject('proj-1');
    expect(useProjectStore.getState().activeProjectId).toBe('proj-1');
  });
});
