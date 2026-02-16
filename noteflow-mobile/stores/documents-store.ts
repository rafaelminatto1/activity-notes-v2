import { create } from 'zustand';
import { Document } from '@/types/document';

interface DocumentsState {
  documents: Document[];
  currentDocument: Document | null;
  isLoading: boolean;
  isSaving: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  setDocuments: (documents: Document[]) => void;
  addDocument: (document: Document) => void;
  updateDocumentInStore: (id: string, updates: Partial<Document>) => void;
  removeDocument: (id: string) => void;
  setCurrentDocument: (document: Document | null) => void;
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  setSaveStatus: (status: 'idle' | 'saving' | 'saved' | 'error') => void;
  getFavorites: () => Document[];
  getRecent: (recentIds: string[]) => Document[];
  searchDocuments: (query: string) => Document[];
}

export const useDocumentsStore = create<DocumentsState>((set, get) => ({
  documents: [],
  currentDocument: null,
  isLoading: true,
  isSaving: false,
  saveStatus: 'idle',

  setDocuments: (documents) => set({ documents, isLoading: false }),

  addDocument: (document) =>
    set((state) => ({
      documents: [document, ...state.documents],
    })),

  updateDocumentInStore: (id, updates) =>
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === id ? { ...doc, ...updates } : doc
      ),
      currentDocument:
        state.currentDocument?.id === id
          ? { ...state.currentDocument, ...updates }
          : state.currentDocument,
    })),

  removeDocument: (id) =>
    set((state) => ({
      documents: state.documents.filter((doc) => doc.id !== id),
    })),

  setCurrentDocument: (document) => set({ currentDocument: document }),

  setLoading: (isLoading) => set({ isLoading }),

  setSaving: (isSaving) => set({ isSaving }),

  setSaveStatus: (saveStatus) => set({ saveStatus }),

  getFavorites: () => {
    return get().documents.filter((doc) => doc.isFavorite);
  },

  getRecent: (recentIds: string[]) => {
    const docs = get().documents;
    return recentIds
      .map((id) => docs.find((doc) => doc.id === id))
      .filter((doc): doc is Document => !!doc);
  },

  searchDocuments: (query: string) => {
    const docs = get().documents;
    const lowerQuery = query.toLowerCase();
    return docs.filter(
      (doc) =>
        doc.title.toLowerCase().includes(lowerQuery) ||
        doc.plainText.toLowerCase().includes(lowerQuery)
    );
  },
}));
