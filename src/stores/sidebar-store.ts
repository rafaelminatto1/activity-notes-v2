import { create } from "zustand";
import { persist } from "zustand/middleware";

const MIN_WIDTH = 240;
const MAX_WIDTH = 480;
const DEFAULT_WIDTH = 300;

interface SidebarStore {
  isOpen: boolean;
  isResizing: boolean;
  width: number;
  isMobileOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
  setWidth: (width: number) => void;
  setIsResizing: (isResizing: boolean) => void;
  toggleMobile: () => void;
  closeMobile: () => void;
}

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set) => ({
      isOpen: true,
      isResizing: false,
      width: DEFAULT_WIDTH,
      isMobileOpen: false,
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      setWidth: (width) =>
        set({ width: Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, width)) }),
      setIsResizing: (isResizing) => set({ isResizing }),
      toggleMobile: () => set((state) => ({ isMobileOpen: !state.isMobileOpen })),
      closeMobile: () => set({ isMobileOpen: false }),
    }),
    {
      name: "activitynotes-sidebar",
      partialize: (state) => ({
        isOpen: state.isOpen,
        width: state.width,
      }),
    }
  )
);

export { MIN_WIDTH, MAX_WIDTH, DEFAULT_WIDTH };
