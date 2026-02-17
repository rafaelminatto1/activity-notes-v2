import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./config";
import type { Comment } from "@/types/smart-note";

function getDb() {
  if (!db) throw new Error("Firestore não inicializado.");
  return db;
}

const COMMENTS_COLLECTION = "comments";

export async function addComment(userId: string, data: Partial<Comment>): Promise<string> {
  const colRef = collection(getDb(), COMMENTS_COLLECTION);
  const docRef = await addDoc(colRef, {
    ...data,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateComment(commentId: string, updates: Partial<Comment>): Promise<void> {
  const docRef = doc(getDb(), COMMENTS_COLLECTION, commentId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteComment(commentId: string): Promise<void> {
  const docRef = doc(getDb(), COMMENTS_COLLECTION, commentId);
  await deleteDoc(docRef);
}

export function subscribeToComments(
  documentId: string,
  callback: (comments: Comment[]) => void
) {
  const q = query(
    collection(getDb(), COMMENTS_COLLECTION),
    where("documentId", "==", documentId),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data()
    })) as Comment[];
    callback(comments);
  });
}

export async function getComment(commentId: string): Promise<Comment | null> {
  const docRef = doc(getDb(), COMMENTS_COLLECTION, commentId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Comment;
}
