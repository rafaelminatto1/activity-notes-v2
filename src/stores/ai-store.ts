import { create } from "zustand";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface AIStore {
  // Panel state
  panelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;

  // Chat history (session only, not persisted)
  messages: ChatMessage[];
  addMessage: (role: "user" | "assistant", content: string) => void;
  clearMessages: () => void;

  // Loading state
  chatLoading: boolean;
  setChatLoading: (loading: boolean) => void;
}

export const useAIStore = create<AIStore>((set) => ({
  panelOpen: false,
  openPanel: () => set({ panelOpen: true }),
  closePanel: () => set({ panelOpen: false }),
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),

  messages: [],
  addMessage: (role, content) =>
    set((s) => ({
      messages: [...s.messages, { role, content, timestamp: Date.now() }],
    })),
  clearMessages: () => set({ messages: [] }),

  chatLoading: false,
  setChatLoading: (chatLoading) => set({ chatLoading }),
}));
