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
import type { Template } from "@/types/smart-note";
import { JSONContent } from "@tiptap/react";

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
  await setDoc(
    ref,
    {
      ...data,
      favoriteTemplateIds: [],
      createdAt: now,
      updatedAt: now,
    },
    { merge: true }
  );
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
    type: data.type || "document",
    content: null,
    plainText: "",
    icon: "",
    coverImage: "",
    workspaceId: "",
    projectId: null,
    spaceId: null,
    folderId: null,
    listId: null,
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

export async function createWebClipDocument(userId: string, data: {
  title: string;
  content: JSONContent | null;
  plainText: string;
  sourceUrl: string;
  coverImage?: string;
  projectId?: string;
  tags?: string[];
}): Promise<string> {
  const colRef = collection(getDb(), "documents");
  const docData = {
    ...data,
    userId,
    type: "document",
    icon: "🌐",
    isArchived: false,
    isPublished: false,
    position: 0,
    childCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(colRef, docData);
  trackDocumentCreated();
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
      (d) =>
        !d.isArchived &&
        (d.parentDocumentId ?? null) === parentDocumentId &&
        (parentDocumentId !== null || !d.projectId)
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
        (d) =>
          !d.isArchived &&
          (d.parentDocumentId ?? null) === parentDocumentId &&
          (parentDocumentId !== null || !d.projectId)
      )
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    callback(docs);
  }, (error) => {
    console.error("Error subscribing to documents:", error);
  });
}

export function subscribeToProjectDocuments(
  userId: string,
  projectId: string,
  callback: (docs: Document[]) => void
) {
  const q = query(collection(getDb(), "documents"), where("userId", "==", userId));

  return onSnapshot(q, (snapshot) => {
    const docs = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Document)
      .filter((d) => !d.isArchived && d.projectId === projectId)
      .sort((a, b) => b.updatedAt.toMillis() - a.updatedAt.toMillis());
    callback(docs);
  }, (error) => {
    console.error("Error subscribing to project documents:", error);
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
  }, (error) => {
    console.error("Error subscribing to document:", error);
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

// ---- Templates CRUD ----

export async function createTemplate(
  userId: string,
  data: Partial<Template>
): Promise<string> {
  const colRef = collection(getDb(), "templates", "user", userId, "items");
  const templateData = {
    name: "",
    description: "",
    content: null,
    icon: "📄",
    color: "#6366f1",
    category: "Geral",
    usageCount: 0,
    isPublic: false,
    ...data,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const docRef = await addDoc(colRef, templateData);
  return docRef.id;
}

export async function getUserTemplates(userId: string): Promise<Template[]> {
  const colRef = collection(getDb(), "templates", "user", userId, "items");
  const q = query(colRef, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Template));
}

export async function getSystemTemplates(): Promise<Template[]> {
  const colRef = collection(getDb(), "templates", "system", "items");
  // Some system templates might not have usageCount yet, so just order by name if count is missing
  const q = query(colRef);
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Template))
    .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
}

export async function getTemplate(
  templateId: string,
  userId?: string,
  isSystem: boolean = false
): Promise<Template | null> {
  let ref;
  if (isSystem) {
    ref = doc(getDb(), "templates", "system", "items", templateId);
  } else if (userId) {
    ref = doc(getDb(), "templates", "user", userId, "items", templateId);
  } else {
    return null;
  }

  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Template;
}

export async function updateTemplate(
  userId: string,
  templateId: string,
  data: Partial<Template>
) {
  const ref = doc(getDb(), "templates", "user", userId, "items", templateId);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

export async function deleteTemplate(userId: string, templateId: string) {
  const ref = doc(getDb(), "templates", "user", userId, "items", templateId);
  await deleteDoc(ref);
}

export async function toggleFavoriteTemplate(
  userId: string,
  templateId: string
): Promise<boolean> {
  const ref = doc(getDb(), "users", userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Perfil de usuário não encontrado.");

  const profile = snap.data() as UserProfile;
  const favoriteTemplateIds = profile.favoriteTemplateIds || [];
  const isFavorite = favoriteTemplateIds.includes(templateId);

  if (isFavorite) {
    await updateDoc(ref, {
      favoriteTemplateIds: arrayRemove(templateId),
      updatedAt: serverTimestamp(),
    });
  } else {
    await updateDoc(ref, {
      favoriteTemplateIds: arrayUnion(templateId),
      updatedAt: serverTimestamp(),
    });
  }

  return !isFavorite;
}

export async function incrementTemplateUsage(
  templateId: string,
  isSystem: boolean,
  userId?: string
) {
  let ref;
  if (isSystem) {
    ref = doc(getDb(), "templates", "system", "items", templateId);
  } else if (userId) {
    ref = doc(getDb(), "templates", "user", userId, "items", templateId);
  } else {
    return;
  }
  await updateDoc(ref, {
    usageCount: increment(1),
    updatedAt: serverTimestamp(),
  });
}

