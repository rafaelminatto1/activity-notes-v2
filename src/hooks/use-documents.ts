"use client";

import { useEffect, useState } from "react";
import { subscribeToDocuments } from "@/lib/firebase/firestore";
import type { Document } from "@/types/document";
import { useAuth } from "./use-auth";

export function useDocuments(parentDocumentId: string | null = null) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToDocuments(
      user.uid,
      parentDocumentId,
      (docs) => {
        setDocuments(docs);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user, parentDocumentId]);

  return { documents, loading };
}
