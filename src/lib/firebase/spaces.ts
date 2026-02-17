import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  writeBatch,
  getDoc,
  onSnapshot,
  Unsubscribe
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Space, SpaceCreate, SpaceUpdate } from "@/types/space";
import { Folder, FolderCreate, FolderUpdate } from "@/types/folder";
import { List, ListCreate, ListUpdate } from "@/types/list";

const SPACES_COLLECTION = "spaces";
const FOLDERS_COLLECTION = "folders";
const LISTS_COLLECTION = "lists";

// --- SPACES ---

export async function createSpace(data: SpaceCreate): Promise<string> {
  if (!db) throw new Error("Firestore not initialized");
  const docRef = await addDoc(collection(db, SPACES_COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateSpace(id: string, data: SpaceUpdate): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  const docRef = doc(db, SPACES_COLLECTION, id);
  await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
}

export async function deleteSpace(id: string): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  const batch = writeBatch(db);
  
  const foldersQuery = query(collection(db, FOLDERS_COLLECTION), where("spaceId", "==", id));
  const foldersSnap = await getDocs(foldersQuery);
  foldersSnap.forEach(d => batch.delete(d.ref));
  
  const listsQuery = query(collection(db, LISTS_COLLECTION), where("spaceId", "==", id));
  const listsSnap = await getDocs(listsQuery);
  listsSnap.forEach(d => batch.delete(d.ref));
  
  batch.delete(doc(db, SPACES_COLLECTION, id));
  await batch.commit();
}

export function subscribeToSpaces(userId: string, callback: (spaces: Space[]) => void): Unsubscribe {
  if (!db) return () => {};
  const q = query(
    collection(db, SPACES_COLLECTION),
    where("userId", "==", userId)
  );
  return onSnapshot(q, (snapshot) => {
    const spaces = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Space));
    callback(spaces);
  });
}

// --- FOLDERS ---

export async function createFolder(data: FolderCreate): Promise<string> {
  if (!db) throw new Error("Firestore not initialized");
  const docRef = await addDoc(collection(db, FOLDERS_COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateFolder(id: string, data: FolderUpdate): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  await updateDoc(doc(db, FOLDERS_COLLECTION, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteFolder(id: string): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  const batch = writeBatch(db);
  const listsQuery = query(collection(db, LISTS_COLLECTION), where("folderId", "==", id));
  const listsSnap = await getDocs(listsQuery);
  listsSnap.forEach(d => batch.delete(d.ref));
  batch.delete(doc(db, FOLDERS_COLLECTION, id));
  await batch.commit();
}

export function subscribeToFolders(spaceId: string, callback: (folders: Folder[]) => void): Unsubscribe {
  if (!db) return () => {};
  const q = query(
    collection(db, FOLDERS_COLLECTION),
    where("spaceId", "==", spaceId)
  );
  return onSnapshot(q, (snapshot) => {
    const folders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Folder));
    callback(folders);
  });
}

// --- LISTS ---

export async function createList(data: ListCreate): Promise<string> {
  if (!db) throw new Error("Firestore not initialized");
  const docRef = await addDoc(collection(db, LISTS_COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateList(id: string, data: ListUpdate): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  await updateDoc(doc(db, LISTS_COLLECTION, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteList(id: string): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  await deleteDoc(doc(db, LISTS_COLLECTION, id));
}

export function subscribeToLists(spaceId: string, callback: (lists: List[]) => void): Unsubscribe {
  if (!db) return () => {};
  const q = query(
    collection(db, LISTS_COLLECTION),
    where("spaceId", "==", spaceId)
  );
  return onSnapshot(q, (snapshot) => {
    const lists = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as List));
    callback(lists);
  });
}

export function subscribeToFolderLists(folderId: string, callback: (lists: List[]) => void): Unsubscribe {
  if (!db) return () => {};
  const q = query(
    collection(db, LISTS_COLLECTION),
    where("folderId", "==", folderId)
  );
  return onSnapshot(q, (snapshot) => {
    const lists = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as List));
    callback(lists);
  });
}
