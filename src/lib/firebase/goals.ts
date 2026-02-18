import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./config";
import type { Goal } from "@/types/goal";
import type { Task } from "@/types/smart-note";

function getDb() {
  if (!db) throw new Error("Firestore não inicializado.");
  return db;
}

const GOALS_COLLECTION = "goals";

export async function createGoal(userId: string, goalData: Partial<Goal>): Promise<string> {
  const colRef = collection(getDb(), GOALS_COLLECTION);
  const docRef = await addDoc(colRef, {
    ...goalData,
    userId,
    status: goalData.status || "active",
    progress: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateGoal(goalId: string, updates: Partial<Goal>): Promise<void> {
  const docRef = doc(getDb(), GOALS_COLLECTION, goalId);
  
  // If keyResults are updated, recalculate overall progress
  if (updates.keyResults) {
    const totalProgress = updates.keyResults.reduce((acc, kr) => acc + kr.progress, 0);
    updates.progress = updates.keyResults.length > 0 ? totalProgress / updates.keyResults.length : 0;
  }

  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function getGoal(goalId: string): Promise<Goal | null> {
  const docRef = doc(getDb(), GOALS_COLLECTION, goalId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Goal;
}

export function subscribeToGoals(userId: string, callback: (goals: Goal[]) => void) {
  const q = query(
    collection(getDb(), GOALS_COLLECTION),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const goals = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data()
    })) as Goal[];
    callback(goals);
  });
}

/**
 * Updates Key Result progress based on linked tasks
 */
export async function syncKeyResultWithTasks(goalId: string, krId: string, tasks: Task[]): Promise<void> {
  const goal = await getGoal(goalId);
  if (!goal) return;

  const krIndex = goal.keyResults.findIndex(kr => kr.id === krId);
  if (krIndex === -1) return;

  const kr = goal.keyResults[krIndex];
  if (kr.type !== "tasks" || !kr.linkedTaskIds) return;

  const linkedTasks = tasks.filter(t => kr.linkedTaskIds!.includes(t.id));
  const completedTasks = linkedTasks.filter(t => t.status === "done").length;
  
  const progress = linkedTasks.length > 0 ? (completedTasks / linkedTasks.length) * 100 : 0;
  
  const updatedKeyResults = [...goal.keyResults];
  updatedKeyResults[krIndex] = {
    ...kr,
    currentValue: completedTasks,
    targetValue: linkedTasks.length,
    progress
  };

  await updateGoal(goalId, { keyResults: updatedKeyResults });
}
