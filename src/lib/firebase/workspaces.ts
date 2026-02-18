import {
  Timestamp,
  Unsubscribe,
  addDoc,
  arrayUnion,
  arrayRemove,
  collection,
  collectionGroup,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "./config";
import type {
  Workspace,
  WorkspaceCreateInput,
  WorkspaceInvitation,
  WorkspaceMember,
  WorkspaceUpdateInput,
} from "@/types/workspace";

const WORKSPACES_COLLECTION = "workspaces";
const WORKSPACE_INVITATIONS_COLLECTION = "workspace_invitations";
const PROJECTS_COLLECTION = "projects";

function getDb() {
  if (!db) {
    throw new Error("Firestore não inicializado. Verifique suas chaves de API.");
  }
  return db;
}

function parseTimestamp(value: unknown): Timestamp | null {
  return value instanceof Timestamp ? value : null;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && !!item.trim());
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter((item) => !!item.trim())));
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function invitationId(workspaceId: string, email: string): string {
  return `${workspaceId}__${normalizeEmail(email)}`;
}

function normalizeWorkspace(id: string, data: Record<string, unknown>): Workspace {
  return {
    id,
    name: typeof data.name === "string" ? data.name : "Sem nome",
    icon: typeof data.icon === "string" ? data.icon : "🏢",
    ownerId: typeof data.ownerId === "string" ? data.ownerId : "",
    members: normalizeStringArray(data.members),
    createdAt: parseTimestamp(data.createdAt) ?? Timestamp.now(),
    updatedAt: parseTimestamp(data.updatedAt) ?? Timestamp.now(),
  };
}

function normalizeWorkspaceMember(
  id: string,
  data: Record<string, unknown>
): WorkspaceMember {
  const role = data.role === "owner" ? "owner" : "member";
  return {
    uid: typeof data.uid === "string" ? data.uid : id,
    email: typeof data.email === "string" ? data.email : "",
    displayName: typeof data.displayName === "string" ? data.displayName : "Membro",
    role,
    invitationId: typeof data.invitationId === "string" ? data.invitationId : undefined,
    joinedAt: parseTimestamp(data.joinedAt),
  };
}

function normalizeWorkspaceInvitation(
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

function mergeAndSortByUpdatedAt<T extends { id: string; updatedAt: Timestamp | null }>(
  first: T[],
  second: T[]
): T[] {
  const map = new Map<string, T>();
  [...first, ...second].forEach((item) => map.set(item.id, item));
  return Array.from(map.values()).sort(
    (a, b) => (b.updatedAt?.toMillis() || 0) - (a.updatedAt?.toMillis() || 0)
  );
}

export async function createWorkspace(
  ownerId: string,
  data: WorkspaceCreateInput,
  ownerMeta?: { email?: string; displayName?: string }
): Promise<string> {
  const members = uniqueStrings([ownerId, ...(data.members || [])]);
  const docRef = await addDoc(collection(getDb(), WORKSPACES_COLLECTION), {
    name: data.name,
    icon: data.icon || "🏢",
    ownerId,
    members,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await setDoc(doc(getDb(), WORKSPACES_COLLECTION, docRef.id, "members", ownerId), {
    uid: ownerId,
    email: ownerMeta?.email || "",
    displayName: ownerMeta?.displayName || "Owner",
    role: "owner",
    joinedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updateWorkspace(
  workspaceId: string,
  ownerId: string,
  data: WorkspaceUpdateInput
): Promise<void> {
  const payload: Record<string, unknown> = {
    ...data,
    updatedAt: serverTimestamp(),
  };

  if (data.members) {
    payload.members = uniqueStrings([ownerId, ...data.members]);
  }

  await updateDoc(doc(getDb(), WORKSPACES_COLLECTION, workspaceId), payload);
}

export async function deleteWorkspace(workspaceId: string): Promise<void> {
  const batch = writeBatch(getDb());
  const workspaceRef = doc(getDb(), WORKSPACES_COLLECTION, workspaceId);
  batch.delete(workspaceRef);

  const invitationsQ = query(
    collection(getDb(), WORKSPACE_INVITATIONS_COLLECTION),
    where("workspaceId", "==", workspaceId)
  );
  const invitationsSnap = await getDocs(invitationsQ);
  invitationsSnap.forEach((item) => batch.delete(item.ref));

  const membersQ = query(collection(getDb(), WORKSPACES_COLLECTION, workspaceId, "members"));
  const membersSnap = await getDocs(membersQ);
  membersSnap.forEach((item) => batch.delete(item.ref));

  const projectsQ = query(
    collection(getDb(), PROJECTS_COLLECTION),
    where("workspaceId", "==", workspaceId)
  );
  const projectsSnap = await getDocs(projectsQ);
  projectsSnap.forEach((item) => {
    batch.update(item.ref, {
      workspaceId: null,
      visibility: "private",
      memberIds: [],
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();
}

export async function inviteWorkspaceMemberByEmail(params: {
  workspace: Workspace;
  invitedEmail: string;
  invitedBy: string;
  invitedByName: string;
}): Promise<void> {
  const normalizedEmail = normalizeEmail(params.invitedEmail);
  if (!normalizedEmail) throw new Error("Informe um e-mail válido.");

  const inviteRef = doc(
    getDb(),
    WORKSPACE_INVITATIONS_COLLECTION,
    invitationId(params.workspace.id, normalizedEmail)
  );

  await setDoc(
    inviteRef,
    {
      workspaceId: params.workspace.id,
      workspaceName: params.workspace.name,
      workspaceIcon: params.workspace.icon || "🏢",
      invitedEmail: normalizedEmail,
      invitedBy: params.invitedBy,
      invitedByName: params.invitedByName || "Membro",
      status: "pending",
      acceptedBy: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function cancelWorkspaceInvitation(invitationIdValue: string): Promise<void> {
  await updateDoc(doc(getDb(), WORKSPACE_INVITATIONS_COLLECTION, invitationIdValue), {
    status: "canceled",
    updatedAt: serverTimestamp(),
  });
}

export async function declineWorkspaceInvitation(invitationIdValue: string): Promise<void> {
  await updateDoc(doc(getDb(), WORKSPACE_INVITATIONS_COLLECTION, invitationIdValue), {
    status: "declined",
    updatedAt: serverTimestamp(),
  });
}

export async function getWorkspaceInvitationById(
  invitationIdValue: string
): Promise<WorkspaceInvitation | null> {
  const snap = await getDoc(doc(getDb(), WORKSPACE_INVITATIONS_COLLECTION, invitationIdValue));
  if (!snap.exists()) return null;
  return normalizeWorkspaceInvitation(snap.id, snap.data());
}

export async function acceptWorkspaceInvitation(params: {
  invitation: WorkspaceInvitation;
  userId: string;
  email: string;
  displayName: string;
}): Promise<void> {
  const batch = writeBatch(getDb());
  const memberRef = doc(
    getDb(),
    WORKSPACES_COLLECTION,
    params.invitation.workspaceId,
    "members",
    params.userId
  );
  const invitationRef = doc(getDb(), WORKSPACE_INVITATIONS_COLLECTION, params.invitation.id);
  const workspaceRef = doc(getDb(), WORKSPACES_COLLECTION, params.invitation.workspaceId);

  batch.set(memberRef, {
    uid: params.userId,
    email: normalizeEmail(params.email),
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
  batch.update(workspaceRef, {
    members: arrayUnion(params.userId),
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
}

export async function removeWorkspaceMember(
  workspaceId: string,
  memberId: string
): Promise<void> {
  const batch = writeBatch(getDb());
  const memberRef = doc(getDb(), WORKSPACES_COLLECTION, workspaceId, "members", memberId);
  const workspaceRef = doc(getDb(), WORKSPACES_COLLECTION, workspaceId);

  batch.delete(memberRef);
  batch.update(workspaceRef, {
    members: arrayRemove(memberId),
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
}

export async function getWorkspaceById(workspaceId: string): Promise<Workspace | null> {
  const snap = await getDoc(doc(getDb(), WORKSPACES_COLLECTION, workspaceId));
  if (!snap.exists()) return null;
  return normalizeWorkspace(snap.id, snap.data());
}

export function subscribeWorkspaceById(
  workspaceId: string,
  callback: (workspace: Workspace | null) => void
): Unsubscribe {
  const ref = doc(getDb(), WORKSPACES_COLLECTION, workspaceId);
  return onSnapshot(
    ref,
    (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }
      callback(normalizeWorkspace(snapshot.id, snapshot.data()));
    },
    (error) => {
      console.error("Error subscribing workspace:", error);
      callback(null);
    }
  );
}

export function subscribeToWorkspaceMembers(
  workspaceId: string,
  callback: (members: WorkspaceMember[]) => void
): Unsubscribe {
  const membersRef = collection(getDb(), WORKSPACES_COLLECTION, workspaceId, "members");
  return onSnapshot(
    membersRef,
    (snapshot) => {
      const members = snapshot.docs
        .map((item) => normalizeWorkspaceMember(item.id, item.data()))
        .sort((a, b) => a.displayName.localeCompare(b.displayName));
      callback(members);
    },
    (error) => {
      console.error("Error subscribing workspace members:", error);
      callback([]);
    }
  );
}

export function subscribeToWorkspaceInvitations(
  workspaceId: string,
  callback: (invitations: WorkspaceInvitation[]) => void
): Unsubscribe {
  const invitationsQ = query(
    collection(getDb(), WORKSPACE_INVITATIONS_COLLECTION),
    where("workspaceId", "==", workspaceId)
  );
  return onSnapshot(
    invitationsQ,
    (snapshot) => {
      const invitations = snapshot.docs
        .map((item) => normalizeWorkspaceInvitation(item.id, item.data()))
        .sort((a, b) => (b.updatedAt?.toMillis() || 0) - (a.updatedAt?.toMillis() || 0));
      callback(invitations);
    },
    (error) => {
      console.error("Error subscribing workspace invitations:", error);
      callback([]);
    }
  );
}

export function subscribeToInvitationsByEmail(
  email: string,
  callback: (invitations: WorkspaceInvitation[]) => void
): Unsubscribe {
  const normalizedEmail = normalizeEmail(email);
  const invitationsQ = query(
    collection(getDb(), WORKSPACE_INVITATIONS_COLLECTION),
    where("invitedEmail", "==", normalizedEmail)
  );

  return onSnapshot(
    invitationsQ,
    (snapshot) => {
      const invitations = snapshot.docs
        .map((item) => normalizeWorkspaceInvitation(item.id, item.data()))
        .filter((item) => item.status === "pending")
        .sort((a, b) => (b.updatedAt?.toMillis() || 0) - (a.updatedAt?.toMillis() || 0));
      callback(invitations);
    },
    (error) => {
      console.error("Error subscribing incoming invitations:", error);
      callback([]);
    }
  );
}

export function subscribeToUserWorkspaces(
  userId: string,
  callback: (workspaces: Workspace[]) => void
): Unsubscribe {
  let ownerWorkspaces: Workspace[] = [];
  let memberWorkspaces: Workspace[] = [];
  let memberDocWorkspaces: Workspace[] = [];

  const emit = () => {
    callback(
      mergeAndSortByUpdatedAt(
        mergeAndSortByUpdatedAt(ownerWorkspaces, memberWorkspaces),
        memberDocWorkspaces
      )
    );
  };

  const ownedQ = query(collection(getDb(), WORKSPACES_COLLECTION), where("ownerId", "==", userId));
  const memberQ = query(
    collection(getDb(), WORKSPACES_COLLECTION),
    where("members", "array-contains", userId)
  );
  const memberDocsQ = query(collectionGroup(getDb(), "members"), where("uid", "==", userId));

  const unsubOwned = onSnapshot(
    ownedQ,
    (snapshot) => {
      ownerWorkspaces = snapshot.docs.map((item) => normalizeWorkspace(item.id, item.data()));
      emit();
    },
    (error) => {
      console.error("Error subscribing owned workspaces:", error);
      ownerWorkspaces = [];
      emit();
    }
  );

  const unsubMember = onSnapshot(
    memberQ,
    (snapshot) => {
      memberWorkspaces = snapshot.docs.map((item) => normalizeWorkspace(item.id, item.data()));
      emit();
    },
    (error) => {
      console.error("Error subscribing member workspaces:", error);
      memberWorkspaces = [];
      emit();
    }
  );

  const unsubMemberDocs = onSnapshot(
    memberDocsQ,
    (snapshot) => {
      const workspaceIds = Array.from(
        new Set(
          snapshot.docs
            .map((item) => item.ref.parent.parent?.id)
            .filter((value): value is string => !!value)
        )
      );

      void (async () => {
        const workspaceSnapshots = await Promise.all(
          workspaceIds.map((id) => getDoc(doc(getDb(), WORKSPACES_COLLECTION, id)))
        );
        memberDocWorkspaces = workspaceSnapshots
          .filter((item) => item.exists())
          .map((item) => normalizeWorkspace(item.id, item.data() || {}));
        emit();
      })();
    },
    (error) => {
      console.error("Error subscribing member docs workspaces:", error);
      memberDocWorkspaces = [];
      emit();
    }
  );

  return () => {
    unsubOwned();
    unsubMember();
    unsubMemberDocs();
  };
}
