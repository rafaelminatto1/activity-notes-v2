import { create } from "zustand";
import { inviteUserToDocument, subscribeToCollaborators, updatePresence } from "@/lib/firebase/collaboration";
import { toast } from "sonner";

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
  
  // Actions
  init: (documentId: string, currentUser: any) => () => void; // Returns cleanup function
  addCollaborator: (email: string, role: "editor" | "viewer", invitedBy: string) => Promise<void>;
  updateMyPresence: (userId: string, data: Partial<Collaborator>) => Promise<void>;
}

export const useCollaborationStore = create<CollaborationStore>((set, get) => ({
  documentId: null,
  collaborators: [],
  isCollaborativeMode: false,

  init: (documentId, currentUser) => {
    set({ documentId, isCollaborativeMode: true });
    
    // Subscribe to collaborators
    const unsubscribe = subscribeToCollaborators(documentId, (collaborators) => {
      set({ collaborators });
    });

    // Initial presence
    if (currentUser) {
      updatePresence(documentId, currentUser.uid, {
        name: currentUser.displayName || "Anonymous",
        email: currentUser.email || "",
        avatar: currentUser.photoURL,
        role: "editor", // default for now
      });
    }

    return () => {
      unsubscribe();
      set({ isCollaborativeMode: false, collaborators: [] });
    };
  },

  addCollaborator: async (email, role, invitedBy) => {
    const { documentId } = get();
    if (!documentId) return;

    try {
      await inviteUserToDocument(documentId, email, role, invitedBy);
      toast.success(`Convite enviado para ${email}`);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao enviar convite");
    }
  },

  updateMyPresence: async (userId, data) => {
    const { documentId } = get();
    if (!documentId) return;
    await updatePresence(documentId, userId, data);
  },
}));

