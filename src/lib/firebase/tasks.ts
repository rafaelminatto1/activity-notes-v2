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
  getFirestore,
  onSnapshot,
} from "firebase/firestore";
import type { Task } from "@/types/smart-note";

const db = getFirestore();
const TASKS_COLLECTION = "tasks";

export async function createTask(userId: string, taskData: Partial<Task>): Promise<string> {
  const colRef = collection(db, TASKS_COLLECTION);
  const docRef = await addDoc(colRef, {
    ...taskData,
    userId,
    status: taskData.status || "todo",
    priority: taskData.priority || "medium",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
  const docRef = doc(db, TASKS_COLLECTION, taskId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTask(taskId: string): Promise<void> {
  const docRef = doc(db, TASKS_COLLECTION, taskId);
  await deleteDoc(docRef);
}

export async function getTasks(userId: string, documentId?: string): Promise<Task[]> {
  const constraints = [
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  ];

  if (documentId) {
    constraints.unshift(where("documentId", "==", documentId));
  }

  const q = query(collection(db, TASKS_COLLECTION), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Task[];
}

export function subscribeToTasks(
  userId: string,
  documentId: string | null | undefined,
  callback: (tasks: Task[]) => void
) {
  const constraints = [where("userId", "==", userId)];
  
  if (documentId) {
    constraints.push(where("documentId", "==", documentId));
  }
  
  // Ordenação pode exigir índice composto se filtrar por documentId também
  // Por enquanto, ordenamos no cliente se falhar, ou criamos índice.
  // Vamos tentar sem orderBy na query composta para evitar erro imediato de índice
  
  const q = query(collection(db, TASKS_COLLECTION), ...constraints);

  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map((d) => ({ 
      id: d.id, 
      ...d.data() 
    })) as Task[];
    
    // Ordenação Client-side
    tasks.sort((a, b) => {
        const dateA = a.createdAt ? (a.createdAt as any).seconds : 0;
        const dateB = b.createdAt ? (b.createdAt as any).seconds : 0;
        return dateB - dateA;
    });

    callback(tasks);
  });
}
