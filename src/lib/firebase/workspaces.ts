import {
  Timestamp,
  doc,
  getDoc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "./config";
import type { WorkspaceInvitation } from "@/types/workspace";

const WORKSPACES_COLLECTION = "workspaces";
const WORKSPACE_INVITATIONS_COLLECTION = "workspace_invitations";

function getDb() {
  if (!db) {
    throw new Error("Firestore não inicializado. Verifique suas chaves de API.");
  }
  return db;
}

function parseTimestamp(value: unknown): Timestamp | null {
  return value instanceof Timestamp ? value : null;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeInvitation(
  id: string,
  data: Record<string, unknown>
): WorkspaceInvitation {
  const status =
    data.status === "accepted" ||
    data.status === "declined" ||
    data.status === "canceled"
      ? data.status
      : "pending";

  return {
    id,
    workspaceId: typeof data.workspaceId === "string" ? data.workspaceId : "",
    workspaceName: typeof data.workspaceName === "string" ? data.workspaceName : "Espaço",
    workspaceIcon: typeof data.workspaceIcon === "string" ? data.workspaceIcon : "🏢",
    invitedEmail: typeof data.invitedEmail === "string" ? data.invitedEmail : "",
    invitedBy: typeof data.invitedBy === "string" ? data.invitedBy : "",
    invitedByName: typeof data.invitedByName === "string" ? data.invitedByName : "Membro",
    status,
    acceptedBy: typeof data.acceptedBy === "string" ? data.acceptedBy : null,
    createdAt: parseTimestamp(data.createdAt),
    updatedAt: parseTimestamp(data.updatedAt),
  };
}

export async function getWorkspaceInvitationById(
  invitationId: string
): Promise<WorkspaceInvitation | null> {
  const ref = doc(getDb(), WORKSPACE_INVITATIONS_COLLECTION, invitationId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return normalizeInvitation(snap.id, snap.data());
}

export async function acceptWorkspaceInvitation(params: {
  invitation: WorkspaceInvitation;
  userId: string;
  email: string;
  displayName: string;
}): Promise<void> {
  const userEmail = normalizeEmail(params.email);
  if (!userEmail) {
    throw new Error("Seu usuário não possui e-mail válido para aceitar o convite.");
  }

  const invitationRef = doc(
    getDb(),
    WORKSPACE_INVITATIONS_COLLECTION,
    params.invitation.id
  );
  const memberRef = doc(
    getDb(),
    WORKSPACES_COLLECTION,
    params.invitation.workspaceId,
    "members",
    params.userId
  );

  const batch = writeBatch(getDb());
  batch.set(memberRef, {
    uid: params.userId,
    email: userEmail,
    displayName: params.displayName || "Membro",
    role: "member",
    invitationId: params.invitation.id,
    joinedAt: serverTimestamp(),
  });
  batch.update(invitationRef, {
    status: "accepted",
    acceptedBy: params.userId,
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
}
