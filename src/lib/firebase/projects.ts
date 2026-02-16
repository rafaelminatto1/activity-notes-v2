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
import { Project, ProjectCreate, ProjectUpdate } from "@/types/project";
// import { Document } from "@/types/document";

const PROJECTS_COLLECTION = "projects";
const DOCUMENTS_COLLECTION = "documents";

/**
 * Cria um novo projeto
 */
export async function createProject(data: ProjectCreate): Promise<string> {
  if (!db) throw new Error("Firestore not initialized");
  try {
    const docRef = await addDoc(collection(db, PROJECTS_COLLECTION), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      documentCount: 0
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating project:", error);
    throw error;
  }
}

/**
 * Atualiza um projeto existente
 */
export async function updateProject(id: string, data: ProjectUpdate): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  try {
    const docRef = doc(db, PROJECTS_COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating project:", error);
    throw error;
  }
}

/**
 * Exclui um projeto
 * Nota: Documentos associados terão projectId removido (opcional)
 */
export async function deleteProject(id: string): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  try {
    const batch = writeBatch(db);

    // 1. Delete project
    const projectRef = doc(db, PROJECTS_COLLECTION, id);
    batch.delete(projectRef);

    // 2. Unlink documents (optional, but good for data integrity)
    // Needs query to find affected docs
    const q = query(
      collection(db, DOCUMENTS_COLLECTION),
      where("projectId", "==", id)
    );
    const snapshot = await getDocs(q);
    snapshot.forEach((doc) => {
      batch.update(doc.ref, { projectId: null, updatedAt: serverTimestamp() });
    });

    await batch.commit();
  } catch (error) {
    console.error("Error deleting project:", error);
    throw error;
  }
}

/**
 * Busca projetos de um usuário
 */
export async function getUserProjects(userId: string): Promise<Project[]> {
  if (!db) return [];
  try {
    const q = query(
      collection(db, PROJECTS_COLLECTION),
      where("userId", "==", userId)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Project));
  } catch (error) {
    console.error("Error fetching projects:", error);
    throw error;
  }
}

/**
 * Move um documento para um projeto
 */
export async function moveDocumentToProject(docId: string, projectId: string | null): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  try {
    const docRef = doc(db, DOCUMENTS_COLLECTION, docId);

    // Get current doc to check previous project
    // This is for updating counters if we implement them

    await updateDoc(docRef, {
      projectId,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error moving document:", error);
    throw error;
  }
}

/**
 * Inscreve-se para atualizações em tempo real dos projetos do usuário
 */
export function subscribeToUserProjects(userId: string, callback: (projects: Project[]) => void): Unsubscribe {
  if (!db) return () => { };

  const q = query(
    collection(db, PROJECTS_COLLECTION),
    where("userId", "==", userId)
  );

  return onSnapshot(q, (snapshot) => {
    const projects = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Project));
    callback(projects);
  }, (error) => {
    console.error("Error subscribing to projects:", error);
  });
}

/**
 * Busca um projeto pelo ID
 */
export async function getProject(id: string): Promise<Project | null> {
  if (!db) return null;
  const docRef = doc(db, PROJECTS_COLLECTION, id);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() } as Project;
  }
  return null;
}
