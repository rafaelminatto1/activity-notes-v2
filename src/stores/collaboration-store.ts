import { create } from "zustand";

export interface Collaborator {
  id: string;
  name: string;
  avatar?: string;
  email: string;
  role: "owner" | "editor" | "viewer";
  isOnline: boolean;
}

export interface CollaborationStore {
  documentId: string | null;
  collaborators: Collaborator[];
  isCollaborativeMode: boolean;
  liveCursors: Record<string, { x: number; y: number; name: string }>;
  addCollaborator: (email: string, role: "editor" | "viewer") => Promise<void>;
  removeCollaborator: (userId: string) => void;
  updateLiveCursors: (cursors: Record<string, { x: number; y: number; name: string }>) => void;
  setDocument: (documentId: string) => void;
}

export const useCollaborationStore = create<CollaborationStore>((set) => ({
  documentId: null,
  collaborators: [],
  isCollaborativeMode: false,
  liveCursors: {},
  addCollaborator: async () => { throw new Error("Not implemented"); },
  removeCollaborator: () => { throw new Error("Not implemented"); },
  updateLiveCursors: () => { throw new Error("Not implemented"); },
  setDocument: (documentId) => set({ documentId }),
}));
