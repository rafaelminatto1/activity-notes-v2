import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./config";
import type { Automation, AutomationLog } from "@/types/automation";

function getDb() {
  if (!db) throw new Error("Firestore não inicializado.");
  return db;
}

const AUTOMATIONS_COLLECTION = "automations";
const LOGS_COLLECTION = "automation_logs";

export async function createAutomation(userId: string, projectId: string, data: Partial<Automation>): Promise<string> {
  const colRef = collection(getDb(), AUTOMATIONS_COLLECTION);
  const docRef = await addDoc(colRef, {
    ...data,
    userId,
    projectId,
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateAutomation(id: string, updates: Partial<Automation>): Promise<void> {
  const docRef = doc(getDb(), AUTOMATIONS_COLLECTION, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteAutomation(id: string): Promise<void> {
  const docRef = doc(getDb(), AUTOMATIONS_COLLECTION, id);
  await deleteDoc(docRef);
}

export function subscribeToAutomations(projectId: string, callback: (automations: Automation[]) => void) {
  const q = query(
    collection(getDb(), AUTOMATIONS_COLLECTION),
    where("projectId", "==", projectId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const automations = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data()
    })) as Automation[];
    callback(automations);
  });
}

export function subscribeToAutomationLogs(projectId: string, callback: (logs: AutomationLog[]) => void) {
  const q = query(
    collection(getDb(), LOGS_COLLECTION),
    where("projectId", "==", projectId), // Assuming logs have projectId for easier filtering
    orderBy("executedAt", "desc"),
    where("executedAt", ">", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // Last 7 days
  );

  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data()
    })) as AutomationLog[];
    callback(logs);
  });
}
