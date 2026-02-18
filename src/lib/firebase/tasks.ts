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
  setDoc,
} from "firebase/firestore";
import { db } from "./config";
import type { Task } from "@/types/smart-note";
import type { Sprint, SprintCreate } from "@/types/project";
import type { FilterGroup, FilterRule, SavedView } from "@/types/view";
import { updateComment } from "./comments";

function getDb() {
  if (!db) throw new Error("Firestore não inicializado.");
  return db;
}
const TASKS_COLLECTION = "tasks";
const VIEWS_COLLECTION = "views";
const SPRINTS_COLLECTION = "sprints";

function getTimestampMillis(value: unknown): number {
  if (
    typeof value === "object" &&
    value !== null &&
    "toMillis" in value &&
    typeof (value as { toMillis?: unknown }).toMillis === "function"
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }
  return 0;
}

function toComparable(value: unknown): number | string | null {
  if (typeof value === "number" || typeof value === "string") return value;
  if (value instanceof Date) return value.getTime();
  if (
    typeof value === "object" &&
    value !== null &&
    "toMillis" in value &&
    typeof (value as { toMillis?: unknown }).toMillis === "function"
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }
  return null;
}

// --- SPRINTS ---

export async function createSprint(data: SprintCreate): Promise<string> {
  const colRef = collection(getDb(), SPRINTS_COLLECTION);
  const docRef = await addDoc(colRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getSprints(projectId: string): Promise<Sprint[]> {
  const q = query(
    collection(getDb(), SPRINTS_COLLECTION),
    where("projectId", "==", projectId),
    orderBy("startDate", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Sprint));
}

export async function updateSprint(sprintId: string, updates: Partial<Sprint>): Promise<void> {
  const docRef = doc(getDb(), SPRINTS_COLLECTION, sprintId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteSprint(sprintId: string): Promise<void> {
  const docRef = doc(getDb(), SPRINTS_COLLECTION, sprintId);
  await deleteDoc(docRef);
}

export function subscribeToSprints(projectId: string, callback: (sprints: Sprint[]) => void) {
  const q = query(
    collection(getDb(), SPRINTS_COLLECTION),
    where("projectId", "==", projectId),
    orderBy("startDate", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    const sprints = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data()
    })) as Sprint[];
    callback(sprints);
  });
}

/**
 * Finaliza um sprint e move tarefas pendentes para o próximo ou backlog
 */
export async function completeSprint(sprintId: string, nextSprintId?: string | null): Promise<void> {
  const sprintRef = doc(getDb(), SPRINTS_COLLECTION, sprintId);
  
  // 1. Atualizar status do sprint
  await updateDoc(sprintRef, {
    status: "completed",
    completedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // 2. Buscar tarefas inacabadas deste sprint
  const tasksQuery = query(
    collection(getDb(), TASKS_COLLECTION),
    where("sprintId", "==", sprintId)
  );
  const taskSnap = await getDocs(tasksQuery);
  const unfinishedTasks = taskSnap.docs
    .map(d => ({ id: d.id, ...d.data() } as Task))
    .filter(t => t.status !== "done" && t.status !== "cancelled");

  // 3. Mover tarefas inacabadas
  for (const task of unfinishedTasks) {
    await updateTask(task.id, { sprintId: nextSprintId || null });
  }
}

// --- TASKS ---

export async function createTask(userId: string, taskData: Partial<Task>): Promise<string> {
  const colRef = collection(getDb(), TASKS_COLLECTION);
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

export async function createTaskFromComment(
  userId: string, 
  commentId: string, 
  taskData: Partial<Task>
): Promise<string> {
  // 1. Create the task
  const taskId = await createTask(userId, {
    ...taskData,
    commentId,
  });

  // 2. Link comment to task
  await updateComment(commentId, { taskId });

  return taskId;
}

export async function isTaskBlocked(task: Task): Promise<boolean> {
  if (!task.blockedBy || task.blockedBy.length === 0) return false;

  const colRef = collection(getDb(), TASKS_COLLECTION);
  const q = query(colRef, where("__name__", "in", task.blockedBy));
  const snap = await getDocs(q);
  
  const blockingTasks = snap.docs.map(d => ({ id: d.id, ...d.data() } as Task));
  
  // A task is blocked if any of its blocking tasks are NOT "done" or "cancelled"
  return blockingTasks.some(t => t.status !== "done" && t.status !== "cancelled");
}

export async function updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
  const docRef = doc(getDb(), TASKS_COLLECTION, taskId);
  
  // If we're trying to set status to "done", verify blocks
  if (updates.status === "done") {
    // We need the full task to check dependencies
    const snap = await getDocs(query(collection(getDb(), TASKS_COLLECTION), where("__name__", "==", taskId)));
    if (!snap.empty) {
      const task = { id: snap.docs[0].id, ...snap.docs[0].data() } as Task;
      const isBlocked = await isTaskBlocked(task);
      if (isBlocked) {
        throw new Error("Esta tarefa está bloqueada por outras tarefas pendentes.");
      }
    }
  }

  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTask(taskId: string): Promise<void> {
  const docRef = doc(getDb(), TASKS_COLLECTION, taskId);
  await deleteDoc(docRef);
}

export async function assignTaskToSprint(taskId: string, sprintId: string | null): Promise<void> {
  await updateTask(taskId, { sprintId });
}

export async function getTasks(userId: string, documentId?: string): Promise<Task[]> {
  const constraints = [
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  ];

  if (documentId) {
    constraints.unshift(where("documentId", "==", documentId));
  }

  const q = query(collection(getDb(), TASKS_COLLECTION), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Task[];
}

export function subscribeToTasks(
  userId: string,
  documentId: string | null | undefined,
  callback: (tasks: Task[]) => void,
  advancedFilter?: FilterGroup
) {
  const constraints = [where("userId", "==", userId)];

  if (documentId) {
    constraints.push(where("documentId", "==", documentId));
  }

  const q = query(collection(getDb(), TASKS_COLLECTION), ...constraints);

  return onSnapshot(q, (snapshot) => {
    let tasks = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data()
    })) as Task[];

    // Apply Advanced Filters if present
    if (advancedFilter) {
      tasks = tasks.filter(task => evaluateFilterGroup(task, advancedFilter));
    }

    // Client-side Sorting
    tasks.sort((a, b) => {
      const dateA = getTimestampMillis(a.createdAt);
      const dateB = getTimestampMillis(b.createdAt);
      return dateB - dateA;
    });

    callback(tasks);
  }, (error) => {
    console.error("Error subscribing to tasks:", error);
  });
}

export function subscribeToProjectTasks(
  userId: string,
  projectId: string,
  callback: (tasks: Task[]) => void
) {
  // Query tasks by userId first
  const q = query(
    collection(getDb(), TASKS_COLLECTION),
    where("userId", "==", userId)
  );

  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() } as Task))
      .filter((t) => t.projectId === projectId); // Filter by projectId client-side if not indexed
    
    // Sort by creation date
    tasks.sort((a, b) => {
      const dateA = getTimestampMillis(a.createdAt);
      const dateB = getTimestampMillis(b.createdAt);
      return dateB - dateA;
    });

    callback(tasks);
  });
}

export function subscribeToListTasks(
  userId: string,
  listId: string,
  callback: (tasks: Task[]) => void
) {
  const q = query(
    collection(getDb(), TASKS_COLLECTION),
    where("userId", "==", userId)
  );

  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() } as Task))
      .filter((t) => t.listId === listId);
    
    tasks.sort((a, b) => {
      const dateA = getTimestampMillis(a.createdAt);
      const dateB = getTimestampMillis(b.createdAt);
      return dateB - dateA;
    });

    callback(tasks);
  });
}

// --- FILTER EVALUATION ---

function evaluateFilterGroup(item: Task, group: FilterGroup): boolean {
  if (!group.rules || group.rules.length === 0) return true;

  if (group.logic === "AND") {
    return group.rules.every(rule => 
      "logic" in rule 
        ? evaluateFilterGroup(item, rule as FilterGroup)
        : evaluateFilterRule(item, rule as FilterRule)
    );
  } else {
    return group.rules.some(rule => 
      "logic" in rule 
        ? evaluateFilterGroup(item, rule as FilterGroup)
        : evaluateFilterRule(item, rule as FilterRule)
    );
  }
}

function evaluateFilterRule(item: Task, rule: FilterRule): boolean {
  const value = item[rule.field as keyof Task];
  const target = rule.value;

  switch (rule.operator) {
    case "equals":
      return value === target;
    case "not_equals":
      return value !== target;
    case "contains":
      return String(value || "").toLowerCase().includes(String(target || "").toLowerCase());
    case "not_contains":
      return !String(value || "").toLowerCase().includes(String(target || "").toLowerCase());
    case "is_empty":
      return value === null || value === undefined || value === "";
    case "is_not_empty":
      return value !== null && value !== undefined && value !== "";
    case "greater_than":
    case "after":
      {
        const left = toComparable(value);
        const right = toComparable(target);
        return left !== null && right !== null && left > right;
      }
    case "less_than":
    case "before":
      {
        const left = toComparable(value);
        const right = toComparable(target);
        return left !== null && right !== null && left < right;
      }
    default:
      return true;
  }
}

// --- VIEWS ---

export async function saveView(userId: string, viewData: Partial<SavedView>): Promise<string> {
  const colRef = collection(getDb(), VIEWS_COLLECTION);
  const docRef = viewData.id ? doc(getDb(), VIEWS_COLLECTION, viewData.id) : doc(colRef);
  
  const finalData: Record<string, unknown> = {
    ...viewData,
    id: docRef.id,
    userId,
    updatedAt: serverTimestamp(),
  };

  if (!viewData.id) {
    finalData.createdAt = serverTimestamp();
  }

  await setDoc(docRef, finalData, { merge: true });
  return docRef.id;
}

export function subscribeToViews(userId: string, callback: (views: SavedView[]) => void) {
  const q = query(
    collection(getDb(), VIEWS_COLLECTION),
    where("userId", "==", userId),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    const views = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data()
    })) as SavedView[];
    callback(views);
  });
}

export async function deleteView(viewId: string): Promise<void> {
  const docRef = doc(getDb(), VIEWS_COLLECTION, viewId);
  await deleteDoc(docRef);
}
