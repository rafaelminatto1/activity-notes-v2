import { create } from "zustand";

export interface VersionHistoryItem {
  version: number;
  content: unknown;
  plainText: string;
  createdAt: Date;
}

interface VersionHistoryStore {
  isOpen: boolean;
  currentVersion: number;
  versions: VersionHistoryItem[];
  documentId: string | null;
  openPanel: () => void;
  closePanel: () => void;
  restoreVersion: (version: number) => void;
  setDocument: (documentId: string) => void;
  clearHistory: () => void;
}

export const useVersionHistoryStore = create<VersionHistoryStore>((set) => ({
  isOpen: false,
  currentVersion: 1,
  versions: [],
  documentId: null,
  openPanel: () => set({ isOpen: true }),
  closePanel: () => set({ isOpen: false }),
  restoreVersion: (version) => set({ currentVersion: version }),
  setDocument: (documentId) => set({ documentId }),
  clearHistory: () => set({ versions: [], documentId: null }),
}));
