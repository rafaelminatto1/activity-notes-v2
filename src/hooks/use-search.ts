"use client";

import { useState, useCallback } from "react";
import { searchDocuments } from "@/lib/firebase/firestore";
import { trackSearchPerformed } from "@/lib/firebase/analytics";
import type { Document } from "@/types/document";
import { useAuth } from "./use-auth";

export function useSearch() {
  const { user } = useAuth();
  const [results, setResults] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(
    async (query: string) => {
      if (!user || !query.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const docs = await searchDocuments(user.uid, query);
        setResults(docs);
        trackSearchPerformed();
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const clear = useCallback(() => {
    setResults([]);
  }, []);

  return { results, loading, search, clear };
}
