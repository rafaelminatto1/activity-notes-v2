import { useEffect, useRef } from "react";
import { generateEmbedding } from "@/lib/gemini/client";
import { saveEmbedding } from "@/lib/firebase/embeddings";
import { useEditorStore } from "@/stores/editor-store";
import { useAuth } from "@/hooks/use-auth";
import { getDocument } from "@/lib/firebase/firestore";
import { useDebounceCallback } from "usehooks-ts";
import { stringHash } from "@/lib/utils";

export function useAutoEmbedding(documentId: string) {
  const { user } = useAuth();
  const lastSaved = useEditorStore((s) => s.lastSaved);
  const lastProcessedHash = useRef<string>("");

  const generateAndSave = useDebounceCallback(async () => {
    if (!user || !documentId) return;

    try {
      // 1. Fetch latest content
      const doc = await getDocument(documentId);
      if (!doc || !doc.plainText || doc.plainText.length < 50) return;

      // 2. Check if content has changed significantly using hash
      const currentHash = stringHash(doc.plainText);
      if (currentHash === lastProcessedHash.current) {
        return; // Content hasn't changed enough to warrant new embedding
      }

      // 3. Generate Embedding
      const vector = await generateEmbedding(doc.plainText);

      // 4. Save to Firestore
      await saveEmbedding(user.uid, documentId, vector);
      
      // Update hash ref
      lastProcessedHash.current = currentHash;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[AutoEmbedding] Embedding updated for ${documentId}`);
      }
    } catch (error) {
      console.error("[AutoEmbedding] Failed to generate embedding:", error);
    }
  }, 5000); // Wait 5s after save to avoid rate limits

  useEffect(() => {
    if (lastSaved) {
      generateAndSave();
    }
  }, [lastSaved, generateAndSave]);
}
