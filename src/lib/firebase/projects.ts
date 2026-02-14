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
  orderBy,
  writeBatch,
  serverTimestamp,
  runTransaction,
  getFirestore,
} from "firebase/firestore";
import type { Project, ProjectCreate, ProjectUpdate } from "@/types/project";
import type { Document } from "@/types/document";

export async function createProject(data: ProjectCreate & { userId: string }): Promise<string> {
  const colRef = collection(getFirestore(), "projects");
  const now = serverTimestamp();
  const docData = {
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  const docRef = await addDoc(colRef, docData);
  return docRef.id;
}

export async function getProjects(userId: string): Promise<Project[]> {
  const q = query(
    collection(getFirestore(), "projects"),
    where("userId", "==", userId),
    orderBy("updatedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Project[];
}

export async function getProject(projectId: string): Promise<Project | null> {
  const ref = doc(getFirestore(), "projects", projectId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Project;
}

export async function updateProject(projectId: string, data: ProjectUpdate): Promise<void> {
  const ref = doc(getFirestore(), "projects", projectId);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProject(projectId: string): Promise<void> {
  const db = getFirestore();

  const docsQuery = query(
    collection(db, "documents"),
    where("projectId", "==", projectId)
  );
  const docsSnap = await getDocs(docsQuery);

  const batch = writeBatch(db);
  docsSnap.docs.forEach((docSnap) => {
    batch.update(docSnap.ref, { projectId: null });
  });

  await deleteDoc(doc(db, "projects", projectId));

  if (docsSnap.docs.length > 0) {
    await batch.commit();
  }
}

export async function moveDocumentToProject(docId: string, projectId: string): Promise<void> {
  const ref = doc(getFirestore(), "documents", docId);
  await updateDoc(ref, {
    projectId,
    updatedAt: serverTimestamp(),
  });
}

export async function updateProjectDocumentCount(projectId: string): Promise<void> {
  const db = getFirestore();

  const docsQuery = query(
    collection(db, "documents"),
    where("projectId", "==", projectId),
    where("isArchived", "==", false)
  );

  const docsSnap = await getDocs(docsQuery);
  const count = docsSnap.docs.filter((d) => d.data().isArchived === false).length;

  const projectRef = doc(db, "projects", projectId);
  await updateDoc(projectRef, {
    documentCount: count,
    updatedAt: serverTimestamp(),
  });
}

export async function updateAllProjectDocumentCounts(userId: string): Promise<void> {
  const projects = await getProjects(userId);

  for (const project of projects) {
    try {
      await updateProjectDocumentCount(project.id);
    } catch (error) {
      console.error("Erro ao atualizar contagem do projeto " + project.id + ":", error);
    }
  }
}
