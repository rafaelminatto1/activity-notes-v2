import { useEffect, useCallback, useRef } from 'react';
import { useDocumentsStore } from '@/stores/documents-store';
import { useAuthStore } from '@/stores/auth-store';
import {
  subscribeToDocuments,
  createDocument,
  updateDocument,
  deleteDocument as deleteDoc,
  getDocument,
  toggleFavorite as toggleFav,
  addToRecent,
} from '@/lib/firebase/firestore';
import { DocumentCreate, DocumentUpdate, Document } from '@/types/document';

export function useDocuments() {
  const { user } = useAuthStore();
  const store = useDocumentsStore();
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      store.setDocuments([]);
      return;
    }

    store.setLoading(true);
    unsubRef.current = subscribeToDocuments(user.uid, (docs) => {
      store.setDocuments(docs);
    });

    return () => {
      unsubRef.current?.();
    };
  }, [user?.uid]);

  const create = useCallback(
    async (data: DocumentCreate = {}) => {
      if (!user?.uid) throw new Error('Not authenticated');
      const id = await createDocument(user.uid, data);
      return id;
    },
    [user?.uid]
  );

  const update = useCallback(
    async (docId: string, data: DocumentUpdate) => {
      store.setSaveStatus('saving');
      try {
        await updateDocument(docId, data);
        store.updateDocumentInStore(docId, data);
        store.setSaveStatus('saved');
        setTimeout(() => store.setSaveStatus('idle'), 2000);
      } catch {
        store.setSaveStatus('error');
      }
    },
    [store]
  );

  const remove = useCallback(
    async (docId: string) => {
      await updateDocument(docId, { isArchived: true });
      store.removeDocument(docId);
    },
    [store]
  );

  const permanentDelete = useCallback(
    async (docId: string) => {
      await deleteDoc(docId);
    },
    []
  );

  const restore = useCallback(
    async (docId: string) => {
      await updateDocument(docId, { isArchived: false });
    },
    []
  );

  const toggleFavorite = useCallback(
    async (docId: string, isFavorite: boolean) => {
      if (!user?.uid) return;
      await toggleFav(user.uid, docId, isFavorite);
      store.updateDocumentInStore(docId, { isFavorite });
    },
    [user?.uid, store]
  );

  const openDocument = useCallback(
    async (docId: string) => {
      if (!user?.uid) return;
      const doc = await getDocument(docId);
      if (doc) {
        store.setCurrentDocument(doc);
        await addToRecent(user.uid, docId);
      }
    },
    [user?.uid, store]
  );

  return {
    ...store,
    create,
    update,
    remove,
    permanentDelete,
    restore,
    toggleFavorite,
    openDocument,
  };
}
