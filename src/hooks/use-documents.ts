"use client";

import { useEffect, useState } from "react";
import { subscribeToDocuments } from "@/lib/firebase/firestore";
import type { Document } from "@/types/document";
import { useAuth } from "./use-auth";

export function useDocuments(parentDocumentId: string | null = null) {
  const { user, ready } = useAuth();
  const [documentsState, setDocuments] = useState<Document[]>([]);
  const [loadingState, setLoading] = useState(true);

  useEffect(() => {
    if (!ready || !user) return;

    const unsubscribe = subscribeToDocuments(
      user.uid,
      parentDocumentId,
      (docs) => {
        setDocuments(docs);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [ready, user, parentDocumentId]);

  const documents = ready && user ? documentsState : [];
  const loading = ready && user ? loadingState : false;

  return { documents, loading };
}
