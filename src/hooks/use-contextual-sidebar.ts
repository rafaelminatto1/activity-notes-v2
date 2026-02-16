"use client";

import { useState, useCallback, useEffect } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/config";
import { useDebounce } from "@/hooks/use-debounce";

export interface RelatedDoc {
  documentId: string;
  title: string;
  excerpt: string;
  relevanceScore: number;
}

export function useContextualSidebar(documentId: string, currentText: string) {
  const [relatedDocs, setRelatedDocs] = useState<RelatedDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedText = useDebounce(currentText, 2000); // Wait 2s after typing stops

  const searchRelated = useCallback(async (text: string) => {
    if (!text || text.length < 50) return; // Only search if enough context

    setLoading(true);
    try {
      if (!functions) throw new Error("Firebase functions not initialized");
      const contextualSearch = httpsCallable<
        { text: string; documentId: string; maxResults: number },
        { success: boolean; data: { relatedDocuments: RelatedDoc[] } }
      >(functions, "genkitContextualSearch");

      const result = await contextualSearch({
        text,
        documentId,
        maxResults: 5,
      });

      if (result.data.success) {
        setRelatedDocs(result.data.data.relatedDocuments);
      }
    } catch (error) {
      console.error("Contextual search error:", error);
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    if (debouncedText) {
      searchRelated(debouncedText);
    }
  }, [debouncedText, searchRelated]);

  return {
    relatedDocs,
    loading,
  };
}
