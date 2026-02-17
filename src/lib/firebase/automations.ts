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
  onSnapshot,
  orderBy,
  limit
} from "firebase/firestore";
import { db } from "./config";
import { Automation, AutomationLog } from "@/types/automation";

const AUTOMATIONS_COLLECTION = "automations";
const LOGS_COLLECTION = "automation_logs";

export async function createAutomation(userId: string, projectId: string, data: Partial<Automation>): Promise<string> {
  if (!db) throw new Error("Firestore not initialized");
  const docRef = await addDoc(collection(db, AUTOMATIONS_COLLECTION), {
    ...data,
    userId,
    projectId,
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateAutomation(id: string, data: Partial<Automation>): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  await updateDoc(doc(db, AUTOMATIONS_COLLECTION, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteAutomation(id: string): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  await deleteDoc(doc(db, AUTOMATIONS_COLLECTION, id));
}

export function subscribeToAutomations(projectId: string, callback: (automations: Automation[]) => void) {
  if (!db) return () => {};
  const q = query(
    collection(db, AUTOMATIONS_COLLECTION),
    where("projectId", "==", projectId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snapshot) => {
    const automations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Automation));
    callback(automations);
  });
}

export function subscribeToAutomationLogs(projectId: string, callback: (logs: AutomationLog[]) => void) {
  if (!db) return () => {};
  const q = query(
    collection(db, LOGS_COLLECTION),
    where("projectId", "==", projectId),
    orderBy("executedAt", "desc"),
    limit(50)
  );
  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AutomationLog));
    callback(logs);
  });
}
