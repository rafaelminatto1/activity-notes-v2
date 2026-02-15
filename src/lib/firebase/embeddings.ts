import {
  collection,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  getFirestore,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { generateEmbedding } from "@/lib/gemini/client";
import { getDocument } from "./firestore";
import type { Embedding } from "@/types/smart-note";
import type { Document } from "@/types/document";
import { cosineSimilarity } from "@/lib/utils/math";

const db = getFirestore();
const EMBEDDINGS_COLLECTION = "embeddings";

export async function saveEmbedding(userId: string, documentId: string, vector: number[]): Promise<void> {
  const embeddingData: Omit<Embedding, "id"> & { userId: string } = {
    documentId,
    userId,
    vector,
    model: "text-embedding-004",
    updatedAt: serverTimestamp() as any,
  };

  const docRef = doc(db, EMBEDDINGS_COLLECTION, documentId);
  await setDoc(docRef, embeddingData);
}

export async function getEmbedding(documentId: string): Promise<Embedding | null> {
  const docRef = doc(db, EMBEDDINGS_COLLECTION, documentId);
  const snap = await getDoc(docRef);
  
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Embedding;
}

export async function searchSimilarDocuments(userId: string, searchQuery: string, limitCount = 5): Promise<Document[]> {
  try {
    const queryVector = await generateEmbedding(searchQuery);

    const coll = collection(db, EMBEDDINGS_COLLECTION);

    // Fallback: fetch all embeddings for user and do cosine similarity in memory
    // Firestore vector search requires exact index setup and might not be available in all regions/versions
    const vectorQ = query(
      coll,
      where("userId", "==", userId)
    );

    const snapshot = await getDocs(vectorQ);
    const embeddingDocs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Embedding));

    // Sort by similarity
    embeddingDocs.sort((a, b) => {
      const simA = cosineSimilarity(queryVector, a.vector);
      const simB = cosineSimilarity(queryVector, b.vector);
      return simB - simA;
    });

    const topDocs = embeddingDocs.slice(0, limitCount);

    const docPromises = topDocs.map(emb => getDocument(emb.documentId));
    const docs = await Promise.all(docPromises);

    return docs.filter((d): d is Document => d !== null && !d.isArchived);
  } catch (error) {
    console.error("Vector search failed:", error);
    return [];
  }
}
