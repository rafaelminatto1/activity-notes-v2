import { create } from "zustand";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface EditorStore {
  saveStatus: SaveStatus;
  lastSaved: Date | null;
  setSaving: () => void;
  setSaved: () => void;
  setError: () => void;
  setIdle: () => void;
}

let savedTimeout: ReturnType<typeof setTimeout> | null = null;

export const useEditorStore = create<EditorStore>((set) => ({
  saveStatus: "idle",
  lastSaved: null,
  setSaving: () => {
    if (savedTimeout) clearTimeout(savedTimeout);
    set({ saveStatus: "saving" });
  },
  setSaved: () => {
    if (savedTimeout) clearTimeout(savedTimeout);
    set({ saveStatus: "saved", lastSaved: new Date() });
    savedTimeout = setTimeout(() => {
      set({ saveStatus: "idle" });
    }, 3000);
  },
  setError: () => {
    if (savedTimeout) clearTimeout(savedTimeout);
    set({ saveStatus: "error" });
  },
  setIdle: () => {
    if (savedTimeout) clearTimeout(savedTimeout);
    set({ saveStatus: "idle" });
  },
}));
