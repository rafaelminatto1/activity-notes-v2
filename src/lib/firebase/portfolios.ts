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
  serverTimestamp,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "./config";
import { Portfolio, ProjectProgress } from "@/types/portfolio";
import { getProject } from "./projects";
import { getTasks } from "./tasks";
import { Task } from "@/types/smart-note";

const COLLECTION = "portfolios";

function getDb() {
  if (!db) throw new Error("Firestore não inicializado.");
  return db;
}

export async function createPortfolio(userId: string, name: string, projectIds: string[]): Promise<string> {
  const colRef = collection(getDb(), COLLECTION);
  const docRef = await addDoc(colRef, {
    name,
    projectIds,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getPortfolios(userId: string): Promise<Portfolio[]> {
  const q = query(
    collection(getDb(), COLLECTION),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Portfolio));
}

export function subscribeToPortfolios(userId: string, callback: (portfolios: Portfolio[]) => void) {
  const q = query(
    collection(getDb(), COLLECTION),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    const portfolios = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Portfolio));
    callback(portfolios);
  });
}

export async function getPortfolio(id: string): Promise<Portfolio | null> {
  const docRef = doc(getDb(), COLLECTION, id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Portfolio;
}

export async function updatePortfolio(id: string, updates: Partial<Portfolio>): Promise<void> {
  const docRef = doc(getDb(), COLLECTION, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deletePortfolio(id: string): Promise<void> {
  const docRef = doc(getDb(), COLLECTION, id);
  await deleteDoc(docRef);
}

export async function getPortfolioProgress(portfolio: Portfolio): Promise<ProjectProgress[]> {
  const results: ProjectProgress[] = [];

  for (const projectId of portfolio.projectIds) {
    const project = await getProject(projectId);
    if (!project) continue;

    const tasks = await getTasks(portfolio.userId); // This is inefficient if many tasks exist, ideally query by projectId
    // Filter tasks by projectId if they have it, or by document relationships if tasks are in docs
    const projectTasks = tasks.filter(t => (t as Task & { projectId?: string }).projectId === projectId);

    const stats = {
      total: projectTasks.length,
      todo: projectTasks.filter(t => t.status === "todo").length,
      in_progress: projectTasks.filter(t => t.status === "in_progress").length,
      done: projectTasks.filter(t => t.status === "done").length,
    };

    const progress = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
    
    let status: ProjectProgress["status"] = "on_track";
    if (progress === 100) status = "completed";
    else if (progress < 20 && stats.total > 0) status = "off_track";
    else if (progress < 50) status = "at_risk";

    results.push({
      projectId,
      name: project.name,
      status,
      progress,
      startDate: project.createdAt, 
      endDate: (project as { createdAt: Timestamp; endDate?: Timestamp }).endDate, 
      taskStats: stats,
    });
  }

  return results;
}
