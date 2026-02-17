import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { db } from "./config";

export interface ApiKey {
  id: string;
  key: string;
  name: string;
  userId: string;
  createdAt: Timestamp;
  lastUsedAt?: Timestamp;
}

const COLLECTION = "api_keys";

function getDb() {
  if (!db) throw new Error("Firestore não inicializado.");
  return db;
}

export async function createApiKey(userId: string, name: string): Promise<string> {
  const colRef = collection(getDb(), COLLECTION);
  const key = `an_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  const newDoc = doc(colRef);
  
  await setDoc(newDoc, {
    id: newDoc.id,
    key,
    name,
    userId,
    createdAt: serverTimestamp(),
  });

  return key;
}

export async function getApiKeys(userId: string): Promise<ApiKey[]> {
  const q = query(collection(getDb(), COLLECTION), where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ApiKey));
}

export async function deleteApiKey(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), COLLECTION, id));
}

export async function validateApiKey(key: string): Promise<string | null> {
  const q = query(collection(getDb(), COLLECTION), where("key", "==", key));
  const snap = await getDocs(q);
  
  if (snap.empty) return null;
  
  const data = snap.docs[0].data() as ApiKey;
  
  // Update last used
  await setDoc(doc(getDb(), COLLECTION, data.id), {
    lastUsedAt: serverTimestamp()
  }, { merge: true });

  return data.userId;
}
