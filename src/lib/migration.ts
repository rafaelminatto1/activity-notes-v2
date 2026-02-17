import {
  collection,
  getDocs,
  writeBatch,
  doc,
  serverTimestamp,
  query,
  where
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Project } from "@/types/project";

export async function migrateProjectsToSpaces(userId: string) {
  if (!db) throw new Error("Firestore not initialized");

  // 1. Get all projects for the user
  const projectsQuery = query(collection(db, "projects"), where("userId", "==", userId));
  const projectsSnap = await getDocs(projectsQuery);
  const projects = projectsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Project));

  if (projects.length === 0) return "No projects to migrate.";

  const batch = writeBatch(db);
  let operationCount = 0;

  // 2. Create a "Migrated Projects" Space or Convert each Project to a Space
  // Strategy: Convert each Project to a Space.
  for (const project of projects) {
    // Create new Space with same ID if possible, or new ID
    // Using new ID is safer to avoid collision if we keep projects for backup
    const newSpaceRef = doc(collection(db, "spaces"));
    
    batch.set(newSpaceRef, {
      name: project.name,
      icon: project.icon,
      color: project.color,
      userId: project.userId,
      isPrivate: true, // Default to private
      createdAt: project.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
      originalProjectId: project.id // specific field for tracking
    });
    operationCount++;

    // 3. Move Documents linked to this Project to the new Space
    const docsQuery = query(collection(db, "documents"), where("projectId", "==", project.id));
    const docsSnap = await getDocs(docsQuery);
    
    docsSnap.forEach(docSnap => {
      batch.update(docSnap.ref, {
        spaceId: newSpaceRef.id,
        // Keep projectId for now as backup? Or maybe clear it?
        // Let's keep it until verified.
      });
      operationCount++;
    });

    // 4. Move Tasks linked to this Project (if any)
    const tasksQuery = query(collection(db, "tasks"), where("projectId", "==", project.id));
    const tasksSnap = await getDocs(tasksQuery);

    // For tasks, we might need a List. Let's create a default "General" list in the Space.
    const defaultListRef = doc(collection(db, "lists"));
    batch.set(defaultListRef, {
      spaceId: newSpaceRef.id,
      folderId: null,
      name: "Geral",
      icon: "📋",
      color: "#808080",
      userId: project.userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      viewType: "list"
    });
    operationCount++;

    tasksSnap.forEach(taskSnap => {
      batch.update(taskSnap.ref, {
        listId: defaultListRef.id,
        spaceId: newSpaceRef.id
      });
      operationCount++;
    });
  }

  // Commit batch
  await batch.commit();
  return `Migrated ${projects.length} projects and ${operationCount} related items.`;
}
