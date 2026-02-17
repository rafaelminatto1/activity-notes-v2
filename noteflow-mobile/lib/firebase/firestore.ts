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
  limit,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  Timestamp,
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

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && !!item.trim());
}

function mergeAndSortDocuments(first: Document[], second: Document[]): Document[] {
  const map = new Map<string, Document>();
  [...first, ...second].forEach((item) => {
    map.set(item.id, item);
  });

  return Array.from(map.values()).sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
  );
}

function docToDocument(id: string, data: Record<string, unknown>): Document {
  const userId = (data.userId as string) || '';
  const allowedUserIds = parseStringArray(data.allowedUserIds);
  if (allowedUserIds.length === 0 && userId) {
    allowedUserIds.push(userId);
  }

  return {
    id,
    title: (data.title as string) || '',
    content: (data.content as Record<string, unknown>) || null,
    plainText: (data.plainText as string) || '',
    icon: (data.icon as string) || '',
    color: (data.color as string) || '#10b981',
    coverImage: (data.coverImage as string) || '',
    workspaceId: (data.workspaceId as string) || null,
    projectId: (data.projectId as string) || null,
    parentDocumentId: (data.parentDocumentId as string) || null,
    userId,
    allowedUserIds,
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
  const allowedUserIds = Array.from(
    new Set([userId, ...((data.allowedUserIds || []).filter((item) => !!item.trim()))])
  );

  const docRef = await addDoc(collection(db, DOCUMENTS_COLLECTION), {
    title: data.title || '',
    content: null,
    plainText: '',
    icon: data.icon || '📝',
    color: data.color || '#10b981',
    coverImage: '',
    workspaceId: data.workspaceId || null,
    projectId: data.projectId || null,
    parentDocumentId: data.parentDocumentId || null,
    userId,
    allowedUserIds,
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
  const q = query(
    collection(db, DOCUMENTS_COLLECTION),
    where('userId', '==', userId),
    limit(200)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => docToDocument(d.id, d.data()))
    .filter((docItem) => !docItem.isArchived)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export async function getArchivedDocuments(userId: string): Promise<Document[]> {
  const q = query(
    collection(db, DOCUMENTS_COLLECTION),
    where('userId', '==', userId),
    limit(200)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => docToDocument(d.id, d.data()))
    .filter((docItem) => docItem.isArchived)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export function subscribeToDocuments(
  userId: string,
  callback: (docs: Document[]) => void
): Unsubscribe {
  let ownedDocuments: Document[] = [];
  let sharedDocuments: Document[] = [];

  const emit = () => {
    callback(mergeAndSortDocuments(ownedDocuments, sharedDocuments));
  };

  const ownedQuery = query(
    collection(db, DOCUMENTS_COLLECTION),
    where('userId', '==', userId),
    limit(200)
  );

  const sharedQuery = query(
    collection(db, DOCUMENTS_COLLECTION),
    where('allowedUserIds', 'array-contains', userId),
    limit(200)
  );

  const unsubOwned = onSnapshot(
    ownedQuery,
    (snapshot) => {
      ownedDocuments = snapshot.docs
        .map((d) => docToDocument(d.id, d.data()))
        .filter((docItem) => !docItem.isArchived);
      emit();
    },
    (error) => {
      console.error('Error subscribing owned documents:', error);
      ownedDocuments = [];
      emit();
    }
  );

  const unsubShared = onSnapshot(
    sharedQuery,
    (snapshot) => {
      sharedDocuments = snapshot.docs
        .map((d) => docToDocument(d.id, d.data()))
        .filter((docItem) => !docItem.isArchived);
      emit();
    },
    (error) => {
      console.error('Error subscribing shared documents:', error);
      sharedDocuments = [];
      emit();
    }
  );

  return () => {
    unsubOwned();
    unsubShared();
  };
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
