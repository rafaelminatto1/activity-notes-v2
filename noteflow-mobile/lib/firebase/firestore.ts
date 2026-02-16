import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  Timestamp,
  QueryConstraint,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './config';
import { Document, DocumentCreate, DocumentUpdate } from '@/types/document';
import { UserProfile } from '@/types/user';

const DOCUMENTS_COLLECTION = 'documents';
const USERS_COLLECTION = 'users';

function parseTimestamp(ts: unknown): Date {
  if (ts instanceof Timestamp) return ts.toDate();
  if (ts instanceof Date) return ts;
  return new Date();
}

function docToDocument(id: string, data: Record<string, unknown>): Document {
  return {
    id,
    title: (data.title as string) || '',
    content: (data.content as Record<string, unknown>) || null,
    plainText: (data.plainText as string) || '',
    icon: (data.icon as string) || '',
    coverImage: (data.coverImage as string) || '',
    parentDocumentId: (data.parentDocumentId as string) || null,
    userId: (data.userId as string) || '',
    isArchived: (data.isArchived as boolean) || false,
    isPublished: (data.isPublished as boolean) || false,
    isFavorite: (data.isFavorite as boolean) || false,
    position: (data.position as number) || 0,
    childCount: (data.childCount as number) || 0,
    createdAt: parseTimestamp(data.createdAt),
    updatedAt: parseTimestamp(data.updatedAt),
  };
}

export async function createDocument(userId: string, data: DocumentCreate): Promise<string> {
  const docRef = await addDoc(collection(db, DOCUMENTS_COLLECTION), {
    title: data.title || '',
    content: null,
    plainText: '',
    icon: data.icon || '📝',
    coverImage: '',
    parentDocumentId: data.parentDocumentId || null,
    userId,
    isArchived: false,
    isPublished: false,
    isFavorite: false,
    position: Date.now(),
    childCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateDocument(docId: string, data: DocumentUpdate): Promise<void> {
  const docRef = doc(db, DOCUMENTS_COLLECTION, docId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteDocument(docId: string): Promise<void> {
  await deleteDoc(doc(db, DOCUMENTS_COLLECTION, docId));
}

export async function getDocument(docId: string): Promise<Document | null> {
  const docSnap = await getDoc(doc(db, DOCUMENTS_COLLECTION, docId));
  if (!docSnap.exists()) return null;
  return docToDocument(docSnap.id, docSnap.data());
}

export async function getUserDocuments(userId: string): Promise<Document[]> {
  const constraints: QueryConstraint[] = [
    where('userId', '==', userId),
    where('isArchived', '==', false),
    orderBy('updatedAt', 'desc'),
    limit(50),
  ];
  const q = query(collection(db, DOCUMENTS_COLLECTION), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => docToDocument(d.id, d.data()));
}

export async function getArchivedDocuments(userId: string): Promise<Document[]> {
  const q = query(
    collection(db, DOCUMENTS_COLLECTION),
    where('userId', '==', userId),
    where('isArchived', '==', true),
    orderBy('updatedAt', 'desc'),
    limit(50)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => docToDocument(d.id, d.data()));
}

export function subscribeToDocuments(
  userId: string,
  callback: (docs: Document[]) => void
): Unsubscribe {
  const q = query(
    collection(db, DOCUMENTS_COLLECTION),
    where('userId', '==', userId),
    where('isArchived', '==', false),
    orderBy('updatedAt', 'desc'),
    limit(50)
  );
  return onSnapshot(q, (snapshot) => {
    const docs = snapshot.docs.map((d) => docToDocument(d.id, d.data()));
    callback(docs);
  });
}

export async function toggleFavorite(userId: string, docId: string, isFavorite: boolean): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, userId);
  const docRef = doc(db, DOCUMENTS_COLLECTION, docId);

  await Promise.all([
    updateDoc(docRef, { isFavorite, updatedAt: serverTimestamp() }),
    updateDoc(userRef, {
      favoriteIds: isFavorite ? arrayUnion(docId) : arrayRemove(docId),
      updatedAt: serverTimestamp(),
    }),
  ]);
}

export async function addToRecent(userId: string, docId: string): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;

  const data = userSnap.data();
  let recentIds: string[] = (data.recentDocIds as string[]) || [];
  recentIds = recentIds.filter((id) => id !== docId);
  recentIds.unshift(docId);
  recentIds = recentIds.slice(0, 10);

  await updateDoc(userRef, {
    recentDocIds: recentIds,
    updatedAt: serverTimestamp(),
  });
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const docSnap = await getDoc(doc(db, USERS_COLLECTION, userId));
  if (!docSnap.exists()) return null;
  const data = docSnap.data();
  return {
    id: docSnap.id,
    displayName: (data.displayName as string) || '',
    email: (data.email as string) || '',
    avatarUrl: (data.avatarUrl as string) || '',
    settings: (data.settings as UserProfile['settings']) || {
      theme: 'system',
      fontSize: 16,
      aiEnabled: true,
      aiLanguage: 'pt-BR',
    },
    favoriteIds: (data.favoriteIds as string[]) || [],
    recentDocIds: (data.recentDocIds as string[]) || [],
    createdAt: parseTimestamp(data.createdAt),
    updatedAt: parseTimestamp(data.updatedAt),
  };
}

export async function updateUserProfile(
  userId: string,
  data: Partial<UserProfile>
): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, userId);
  await updateDoc(userRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}
