import {
  collection,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./config";
import type { WorkspaceRole, WorkspaceMember, ResourceType, PermissionAction } from "@/types/permission";
import { DEFAULT_ROLES } from "@/types/permission";

const ROLES_COLLECTION = "workspace_roles";

function getDb() {
  if (!db) throw new Error("Firestore não inicializado.");
  return db;
}

export async function getMemberRole(workspaceId: string, userId: string): Promise<WorkspaceRole | null> {
  const memberRef = doc(getDb(), "workspaces", workspaceId, "members", userId);
  const memberSnap = await getDoc(memberRef);
  
  if (!memberSnap.exists()) return null;
  
  const memberData = memberSnap.data() as WorkspaceMember;
  const roleId = memberData.roleId;
  
  // Check if it's a default role
  if (DEFAULT_ROLES[roleId]) return DEFAULT_ROLES[roleId];
  
  // Check if it's a custom role
  const roleRef = doc(getDb(), "workspaces", workspaceId, ROLES_COLLECTION, roleId);
  const roleSnap = await getDoc(roleRef);
  
  if (!roleSnap.exists()) return DEFAULT_ROLES.viewer; // Fallback
  
  return roleSnap.data() as WorkspaceRole;
}

export function subscribeToMemberRole(workspaceId: string, userId: string, callback: (role: WorkspaceRole | null) => void) {
  const memberRef = doc(getDb(), "workspaces", workspaceId, "members", userId);
  
  return onSnapshot(memberRef, async (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    
    const memberData = snap.data() as WorkspaceMember;
    const roleId = memberData.roleId;
    
    if (DEFAULT_ROLES[roleId]) {
      callback(DEFAULT_ROLES[roleId]);
      return;
    }
    
    const roleRef = doc(getDb(), "workspaces", workspaceId, ROLES_COLLECTION, roleId);
    const roleSnap = await getDoc(roleRef);
    callback(roleSnap.exists() ? (roleSnap.data() as WorkspaceRole) : DEFAULT_ROLES.viewer);
  });
}

export async function createCustomRole(workspaceId: string, role: Partial<WorkspaceRole>): Promise<string> {
  const rolesRef = collection(getDb(), "workspaces", workspaceId, ROLES_COLLECTION);
  const docRef = doc(rolesRef);
  const finalRole = {
    ...role,
    id: docRef.id,
    createdAt: serverTimestamp(),
  };
  await setDoc(docRef, finalRole);
  return docRef.id;
}

export function hasPermission(role: WorkspaceRole | null, resource: ResourceType, action: PermissionAction): boolean {
  if (!role) return false;
  // Admin bypass
  if (role.id === "admin") return true;
  
  const permissions = role.permissions[resource];
  return permissions?.includes(action) || permissions?.includes("manage");
}
