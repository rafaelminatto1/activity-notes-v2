import { create } from "zustand";
import { subscribeToSpaces, createSpace, updateSpaceOrder } from "@/lib/firebase/spaces";
import { Space } from "@/types/space";

interface SpaceStore {
  spaces: Space[];
  loading: boolean;
  initSubscription: (userId: string) => void;
  cleanupSubscription: () => void;
  createSpace: (userId: string, name: string) => Promise<void>;
  reorderSpaces: (spaces: Space[]) => Promise<void>;
}

export const useSpaceStore = create<SpaceStore>((set, get) => ({
  spaces: [],
  loading: true,
  unsubscribe: null as any,

  initSubscription: (userId: string) => {
    // Prevent double subscription
    if ((get() as any).unsubscribe) return;

    set({ loading: true });
    const unsub = subscribeToSpaces(userId, (spaces) => {
      set({ spaces, loading: false });
    });
    set({ unsubscribe: unsub } as any);
  },

  cleanupSubscription: () => {
    const unsub = (get() as any).unsubscribe;
    if (unsub) {
      unsub();
      set({ unsubscribe: null } as any);
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
