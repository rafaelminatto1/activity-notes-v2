import { create } from "zustand";

interface TemplateStore {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export const useTemplateStore = create<TemplateStore>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));
