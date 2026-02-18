import { create } from "zustand";
import { subscribeToSpaces, createSpace, updateSpaceOrder } from "@/lib/firebase/spaces";
import { Space } from "@/types/space";

interface SpaceStore {
  spaces: Space[];
  loading: boolean;
  unsubscribe: (() => void) | null;
  initSubscription: (userId: string) => void;
  cleanupSubscription: () => void;
  createSpace: (userId: string, name: string) => Promise<void>;
  reorderSpaces: (spaces: Space[]) => Promise<void>;
}

export const useSpaceStore = create<SpaceStore>((set, get) => ({
  spaces: [],
  loading: true,
  unsubscribe: null,

  initSubscription: (userId: string) => {
    // Prevent double subscription
    if (get().unsubscribe) return;

    set({ loading: true });
    const unsub = subscribeToSpaces(userId, (spaces) => {
      set({ spaces, loading: false });
    });
    set({ unsubscribe: unsub });
  },

  cleanupSubscription: () => {
    const unsub = get().unsubscribe;
    if (unsub) {
      unsub();
      set({ unsubscribe: null });
    }
  },

  createSpace: async (userId: string, name: string) => {
    await createSpace({
      userId,
      name,
      icon: "🪐",
      color: "#6366f1",
      isPrivate: true,
      order: get().spaces.length // Append to end
    });
  },

  reorderSpaces: async (spaces: Space[]) => {
    set({ spaces }); // Optimistic update
    try {
      await updateSpaceOrder(spaces);
    } catch (error) {
      console.error("Failed to persist space order:", error);
    }
  }
}));
