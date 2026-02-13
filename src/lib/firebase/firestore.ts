import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  increment,
  setDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "./config";
import { trackDocumentCreated } from "./analytics";
import type { Document, DocumentCreate, DocumentUpdate } from "@/types/document";
import type { UserProfile, UserProfileUpdate } from "@/types/user";

function getDb() {
  if (!db) throw new Error("Firestore não inicializado. Verifique suas chaves de API.");
  return db;
}

// ---- Users ----

export async function createUserProfile(
  userId: string,
  data: Omit<UserProfile, "id" | "createdAt" | "updatedAt">
) {
  const ref = doc(getDb(), "users", userId);
  const now = serverTimestamp();
  await setDoc(ref, { ...data, createdAt: now, updatedAt: now }, { merge: true });
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const ref = doc(getDb(), "users", userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as UserProfile;
}

export async function updateUserProfile(userId: string, data: UserProfileUpdate) {
  const ref = doc(getDb(), "users", userId);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

// ---- Favoritos (denormalizados no user doc para economizar reads) ----

export async function toggleFavorite(userId: string, docId: string): Promise<boolean> {
  const ref = doc(getDb(), "users", userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Perfil de usuário não encontrado.");

  const profile = snap.data() as UserProfile;
  const isFavorite = profile.favoriteIds?.includes(docId) ?? false;

  if (isFavorite) {
    await updateDoc(ref, {
      favoriteIds: arrayRemove(docId),
      updatedAt: serverTimestamp(),
    });
  } else {
    await updateDoc(ref, {
      favoriteIds: arrayUnion(docId),
      updatedAt: serverTimestamp(),
    });
  }

  return !isFavorite;
}

export async function getFavorites(userId: string): Promise<string[]> {
  const profile = await getUserProfile(userId);
  return profile?.favoriteIds ?? [];
}

// ---- Documents CRUD ----

export async function createDocument(userId: string, data: Partial<DocumentCreate> = {}): Promise<string> {
  const colRef = collection(getDb(), "documents");
  const safeData = { ...(data as Record<string, unknown>) };
  delete safeData.userId;
  const docData = {
    title: "",
    content: null,
    plainText: "",
    icon: "",
    coverImage: "",
    workspaceId: "",
    parentDocumentId: null,
    isArchived: false,
    isPublished: false,
    position: 0,
    childCount: 0,
    ...safeData,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(colRef, docData);
  trackDocumentCreated();

  if (data.parentDocumentId) {
    const parentRef = doc(getDb(), "documents", data.parentDocumentId);
    await updateDoc(parentRef, { childCount: increment(1) });
  }

  return docRef.id;
}

export async function getDocument(documentId: string): Promise<Document | null> {
  if (!db) return null;
  const ref = doc(db, "documents", documentId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Document;
}

export async function getDocumentsByParent(
  userId: string,
  parentDocumentId: string | null = null
): Promise<Document[]> {
  // Fallback without composite index dependency:
  // query by userId and do remaining filters client-side.
  const q = query(collection(getDb(), "documents"), where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Document)
    .filter(
      (d) => !d.isArchived && (d.parentDocumentId ?? null) === parentDocumentId
    )
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
}

export async function updateDocument(documentId: string, data: DocumentUpdate) {
  const ref = doc(getDb(), "documents", documentId);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

export async function archiveDocument(documentId: string) {
  await updateDocument(documentId, { isArchived: true });
  await batchArchiveChildren(documentId);
}

export async function restoreDocument(documentId: string) {
  await updateDocument(documentId, { isArchived: false });
}

export async function deleteDocumentPermanently(documentId: string) {
  const ref = doc(getDb(), "documents", documentId);

  // Deletar filhos recursivamente
  const childrenQuery = query(
    collection(getDb(), "documents"),
    where("parentDocumentId", "==", documentId)
  );
  const childSnap = await getDocs(childrenQuery);
  for (const child of childSnap.docs) {
    await deleteDocumentPermanently(child.id);
  }

  await deleteDoc(ref);
}

export async function publishDocument(documentId: string, isPublished: boolean) {
  await updateDocument(documentId, { isPublished });
}

export async function getPublishedDocument(documentId: string): Promise<Document | null> {
  if (!db) return null;
  try {
    const ref = doc(db, "documents", documentId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = { id: snap.id, ...snap.data() } as Document;
    if (!data.isPublished) return null;
    return data;
  } catch {
    // For public preview, permission issues should be handled as "not found".
    return null;
  }
}

export async function getArchivedDocuments(userId: string): Promise<Document[]> {
  const q = query(
    collection(getDb(), "documents"),
    where("userId", "==", userId),
    where("isArchived", "==", true),
    orderBy("updatedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Document);
}

// ---- Busca local (economiza reads — carrega todos docs uma vez) ----

export async function searchDocuments(userId: string, searchTerm: string): Promise<Document[]> {
  const q = query(
    collection(getDb(), "documents"),
    where("userId", "==", userId),
    where("isArchived", "==", false)
  );
  const snap = await getDocs(q);
  const term = searchTerm.toLowerCase();
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Document)
    .filter(
      (doc) =>
        doc.title.toLowerCase().includes(term) ||
        doc.plainText.toLowerCase().includes(term)
    );
}

// ---- Real-time listeners ----
// IMPORTANTE: sempre chamar unsubscribe() quando componente desmontar
// Limitar listeners ativos a 3-5 simultâneos para economizar reads

export function subscribeToDocuments(
  userId: string,
  parentDocumentId: string | null,
  callback: (docs: Document[]) => void
) {
  // Fallback without composite index dependency:
  // subscribe by userId and do remaining filters client-side.
  const q = query(collection(getDb(), "documents"), where("userId", "==", userId));

  return onSnapshot(q, (snapshot) => {
    const docs = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Document)
      .filter(
        (d) => !d.isArchived && (d.parentDocumentId ?? null) === parentDocumentId
      )
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    callback(docs);
  });
}

export function subscribeToDocument(
  documentId: string,
  callback: (doc: Document | null) => void
) {
  const ref = doc(getDb(), "documents", documentId);
  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    callback({ id: snap.id, ...snap.data() } as Document);
  });
}

// ---- Batch operations ----

export async function batchArchiveChildren(parentDocumentId: string) {
  const q = query(
    collection(getDb(), "documents"),
    where("parentDocumentId", "==", parentDocumentId)
  );
  const snap = await getDocs(q);
  if (snap.empty) return;

  const batch = writeBatch(getDb());
  snap.docs.forEach((d) => {
    batch.update(d.ref, { isArchived: true, updatedAt: serverTimestamp() });
  });
  await batch.commit();

  for (const d of snap.docs) {
    await batchArchiveChildren(d.id);
  }
}
