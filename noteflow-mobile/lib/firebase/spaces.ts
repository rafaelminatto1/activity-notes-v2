import {
  Timestamp,
  Unsubscribe,
  addDoc,
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
} from 'firebase/firestore';
import { db } from './config';
import {
  Project,
  ProjectCreateInput,
  ProjectUpdateInput,
} from '@/types/project';
import {
  Workspace,
  WorkspaceInvitation,
  WorkspaceMember,
  WorkspaceCreateInput,
  WorkspaceUpdateInput,
} from '@/types/workspace';

const PROJECTS_COLLECTION = 'projects';
const WORKSPACES_COLLECTION = 'workspaces';
const DOCUMENTS_COLLECTION = 'documents';
const WORKSPACE_INVITATIONS_COLLECTION = 'workspace_invitations';

function parseTimestamp(ts: unknown): Date {
  if (ts instanceof Timestamp) return ts.toDate();
  if (ts instanceof Date) return ts;
  return new Date();
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && !!item.trim());
}

function uniqueStrings(value: string[]): string[] {
  return Array.from(new Set(value.filter((item) => !!item.trim())));
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function invitationId(workspaceId: string, email: string): string {
  return `${workspaceId}__${normalizeEmail(email)}`;
}

function normalizeProject(id: string, data: Record<string, unknown>): Project {
  return {
    id,
    name: (data.name as string) || 'Sem nome',
    icon: (data.icon as string) || '📁',
    color: (data.color as string) || '#10b981',
    kind: (data.kind as Project['kind']) || 'folder',
    visibility: (data.visibility as Project['visibility']) || 'private',
    userId: (data.userId as string) || '',
    workspaceId: (data.workspaceId as string) || null,
    memberIds: normalizeStringArray(data.memberIds),
    documentCount: (data.documentCount as number) || 0,
    createdAt: parseTimestamp(data.createdAt),
    updatedAt: parseTimestamp(data.updatedAt),
  };
}

function normalizeWorkspace(id: string, data: Record<string, unknown>): Workspace {
  return {
    id,
    name: (data.name as string) || 'Sem nome',
    icon: (data.icon as string) || '🏢',
    ownerId: (data.ownerId as string) || '',
    members: normalizeStringArray(data.members),
    createdAt: parseTimestamp(data.createdAt),
    updatedAt: parseTimestamp(data.updatedAt),
  };
}

function normalizeWorkspaceMember(
  id: string,
  data: Record<string, unknown>
): WorkspaceMember {
  return {
    uid: (data.uid as string) || id,
    email: (data.email as string) || '',
    displayName: (data.displayName as string) || 'Membro',
    role: (data.role as WorkspaceMember['role']) || 'member',
    invitationId: (data.invitationId as string) || undefined,
    joinedAt: parseTimestamp(data.joinedAt),
  };
}

function normalizeWorkspaceInvitation(
  id: string,
  data: Record<string, unknown>
): WorkspaceInvitation {
  return {
    id,
    workspaceId: (data.workspaceId as string) || '',
    workspaceName: (data.workspaceName as string) || 'Espaço',
    workspaceIcon: (data.workspaceIcon as string) || '🏢',
    invitedEmail: (data.invitedEmail as string) || '',
    invitedBy: (data.invitedBy as string) || '',
    invitedByName: (data.invitedByName as string) || 'Membro',
    status: (data.status as WorkspaceInvitation['status']) || 'pending',
    acceptedBy: (data.acceptedBy as string) || null,
    createdAt: parseTimestamp(data.createdAt),
    updatedAt: parseTimestamp(data.updatedAt),
  };
}

function mergeAndSortByDate<T extends { id: string; updatedAt: Date }>(
  first: T[],
  second: T[]
): T[] {
  const map = new Map<string, T>();
  [...first, ...second].forEach((item) => {
    map.set(item.id, item);
  });

  return Array.from(map.values()).sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
  );
}

export async function createWorkspace(
  ownerId: string,
  data: WorkspaceCreateInput,
  ownerMeta?: { email?: string; displayName?: string }
): Promise<string> {
  const members = uniqueStrings([ownerId, ...(data.members || [])]);

  const docRef = await addDoc(collection(db, WORKSPACES_COLLECTION), {
    name: data.name,
    icon: data.icon || '🏢',
    ownerId,
    members,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await setDoc(doc(db, WORKSPACES_COLLECTION, docRef.id, 'members', ownerId), {
    uid: ownerId,
    email: ownerMeta?.email || '',
    displayName: ownerMeta?.displayName || 'Owner',
    role: 'owner',
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

  await updateDoc(doc(db, WORKSPACES_COLLECTION, workspaceId), payload);
}

export async function deleteWorkspace(workspaceId: string): Promise<void> {
  const batch = writeBatch(db);
  const workspaceRef = doc(db, WORKSPACES_COLLECTION, workspaceId);
  batch.delete(workspaceRef);

  const invitationQ = query(
    collection(db, WORKSPACE_INVITATIONS_COLLECTION),
    where('workspaceId', '==', workspaceId)
  );
  const invitationSnap = await getDocs(invitationQ);
  invitationSnap.forEach((invitationDoc) => {
    batch.delete(invitationDoc.ref);
  });

  const membersQ = query(
    collection(db, WORKSPACES_COLLECTION, workspaceId, 'members')
  );
  const membersSnap = await getDocs(membersQ);
  membersSnap.forEach((memberDoc) => {
    batch.delete(memberDoc.ref);
  });

  const projectsQ = query(
    collection(db, PROJECTS_COLLECTION),
    where('workspaceId', '==', workspaceId)
  );
  const projectsSnap = await getDocs(projectsQ);
  projectsSnap.forEach((projectDoc) => {
    batch.update(projectDoc.ref, {
      workspaceId: null,
      visibility: 'private',
      memberIds: [],
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();
}

export async function createProject(
  ownerId: string,
  data: ProjectCreateInput
): Promise<string> {
  const memberIds = uniqueStrings([ownerId, ...(data.memberIds || [])]);
  const docRef = await addDoc(collection(db, PROJECTS_COLLECTION), {
    name: data.name,
    icon: data.icon || '📁',
    color: data.color || '#10b981',
    kind: data.kind || 'folder',
    visibility: data.visibility || 'private',
    userId: ownerId,
    workspaceId: data.workspaceId || null,
    memberIds,
    documentCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updateProject(
  projectId: string,
  ownerId: string,
  data: ProjectUpdateInput
): Promise<void> {
  const payload: Record<string, unknown> = {
    ...data,
    updatedAt: serverTimestamp(),
  };

  if (data.memberIds) {
    payload.memberIds = uniqueStrings([ownerId, ...data.memberIds]);
  }

  await updateDoc(doc(db, PROJECTS_COLLECTION, projectId), payload);
}

export async function deleteProject(projectId: string): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, PROJECTS_COLLECTION, projectId));

  const docsQ = query(
    collection(db, DOCUMENTS_COLLECTION),
    where('projectId', '==', projectId)
  );
  const docsSnap = await getDocs(docsQ);
  docsSnap.forEach((documentDoc) => {
    batch.update(documentDoc.ref, {
      projectId: null,
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
  if (!normalizedEmail) throw new Error('Informe um e-mail válido.');

  const inviteRef = doc(
    db,
    WORKSPACE_INVITATIONS_COLLECTION,
    invitationId(params.workspace.id, normalizedEmail)
  );

  await setDoc(
    inviteRef,
    {
      workspaceId: params.workspace.id,
      workspaceName: params.workspace.name,
      workspaceIcon: params.workspace.icon || '🏢',
      invitedEmail: normalizedEmail,
      invitedBy: params.invitedBy,
      invitedByName: params.invitedByName || 'Membro',
      status: 'pending',
      acceptedBy: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function cancelWorkspaceInvitation(invitationIdValue: string): Promise<void> {
  await updateDoc(doc(db, WORKSPACE_INVITATIONS_COLLECTION, invitationIdValue), {
    status: 'canceled',
    updatedAt: serverTimestamp(),
  });
}

export async function declineWorkspaceInvitation(invitationIdValue: string): Promise<void> {
  await updateDoc(doc(db, WORKSPACE_INVITATIONS_COLLECTION, invitationIdValue), {
    status: 'declined',
    updatedAt: serverTimestamp(),
  });
}

export async function getWorkspaceInvitationById(
  invitationIdValue: string
): Promise<WorkspaceInvitation | null> {
  const snap = await getDoc(doc(db, WORKSPACE_INVITATIONS_COLLECTION, invitationIdValue));
  if (!snap.exists()) return null;
  return normalizeWorkspaceInvitation(snap.id, snap.data());
}

export async function acceptWorkspaceInvitation(params: {
  invitation: WorkspaceInvitation;
  userId: string;
  email: string;
  displayName: string;
}): Promise<void> {
  const batch = writeBatch(db);
  const memberRef = doc(
    db,
    WORKSPACES_COLLECTION,
    params.invitation.workspaceId,
    'members',
    params.userId
  );
  const invitationRef = doc(db, WORKSPACE_INVITATIONS_COLLECTION, params.invitation.id);

  batch.set(memberRef, {
    uid: params.userId,
    email: normalizeEmail(params.email),
    displayName: params.displayName || 'Membro',
    role: 'member',
    invitationId: params.invitation.id,
    joinedAt: serverTimestamp(),
  });
  batch.update(invitationRef, {
    status: 'accepted',
    acceptedBy: params.userId,
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
}

export async function removeWorkspaceMember(
  workspaceId: string,
  memberId: string
): Promise<void> {
  const batch = writeBatch(db);
  const memberRef = doc(db, WORKSPACES_COLLECTION, workspaceId, 'members', memberId);
  const workspaceRef = doc(db, WORKSPACES_COLLECTION, workspaceId);

  batch.delete(memberRef);
  batch.update(workspaceRef, {
    members: arrayRemove(memberId),
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
}

export function subscribeToWorkspaceMembers(
  workspaceId: string,
  callback: (members: WorkspaceMember[]) => void
): Unsubscribe {
  const membersRef = collection(db, WORKSPACES_COLLECTION, workspaceId, 'members');
  return onSnapshot(
    membersRef,
    (snapshot) => {
      const members = snapshot.docs.map((item) =>
        normalizeWorkspaceMember(item.id, item.data())
      );
      callback(
        members.sort((a, b) => a.displayName.localeCompare(b.displayName))
      );
    },
    (error) => {
      console.error('Error subscribing workspace members:', error);
      callback([]);
    }
  );
}

export function subscribeToWorkspaceInvitations(
  workspaceId: string,
  callback: (invitations: WorkspaceInvitation[]) => void
): Unsubscribe {
  const invitationsQ = query(
    collection(db, WORKSPACE_INVITATIONS_COLLECTION),
    where('workspaceId', '==', workspaceId)
  );
  return onSnapshot(
    invitationsQ,
    (snapshot) => {
      const invitations = snapshot.docs
        .map((item) => normalizeWorkspaceInvitation(item.id, item.data()))
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      callback(invitations);
    },
    (error) => {
      console.error('Error subscribing workspace invitations:', error);
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
    collection(db, WORKSPACE_INVITATIONS_COLLECTION),
    where('invitedEmail', '==', normalizedEmail)
  );

  return onSnapshot(
    invitationsQ,
    (snapshot) => {
      const invitations = snapshot.docs
        .map((item) => normalizeWorkspaceInvitation(item.id, item.data()))
        .filter((item) => item.status === 'pending')
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      callback(invitations);
    },
    (error) => {
      console.error('Error subscribing incoming invitations:', error);
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
      mergeAndSortByDate(
        mergeAndSortByDate(ownerWorkspaces, memberWorkspaces),
        memberDocWorkspaces
      )
    );
  };

  const ownedQuery = query(
    collection(db, WORKSPACES_COLLECTION),
    where('ownerId', '==', userId)
  );
  const memberQuery = query(
    collection(db, WORKSPACES_COLLECTION),
    where('members', 'array-contains', userId)
  );
  const memberDocsQuery = query(
    collectionGroup(db, 'members'),
    where('uid', '==', userId)
  );

  const unsubOwned = onSnapshot(
    ownedQuery,
    (snapshot) => {
      ownerWorkspaces = snapshot.docs.map((item) =>
        normalizeWorkspace(item.id, item.data())
      );
      emit();
    },
    (error) => {
      console.error('Error subscribing owned workspaces:', error);
      ownerWorkspaces = [];
      emit();
    }
  );

  const unsubMember = onSnapshot(
    memberQuery,
    (snapshot) => {
      memberWorkspaces = snapshot.docs.map((item) =>
        normalizeWorkspace(item.id, item.data())
      );
      emit();
    },
    (error) => {
      console.error('Error subscribing member workspaces:', error);
      memberWorkspaces = [];
      emit();
    }
  );

  const unsubMemberDocs = onSnapshot(
    memberDocsQuery,
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
          workspaceIds.map((id) => getDoc(doc(db, WORKSPACES_COLLECTION, id)))
        );
        memberDocWorkspaces = workspaceSnapshots
          .filter((item) => item.exists())
          .map((item) => normalizeWorkspace(item.id, item.data() || {}));
        emit();
      })();
    },
    (error) => {
      console.error('Error subscribing member docs workspaces:', error);
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

export function subscribeToUserProjects(
  userId: string,
  callback: (projects: Project[]) => void
): Unsubscribe {
  let ownedProjects: Project[] = [];
  let memberProjects: Project[] = [];

  const emit = () => {
    callback(mergeAndSortByDate(ownedProjects, memberProjects));
  };

  const ownedQuery = query(
    collection(db, PROJECTS_COLLECTION),
    where('userId', '==', userId)
  );
  const memberQuery = query(
    collection(db, PROJECTS_COLLECTION),
    where('memberIds', 'array-contains', userId)
  );

  const unsubOwned = onSnapshot(
    ownedQuery,
    (snapshot) => {
      ownedProjects = snapshot.docs.map((item) =>
        normalizeProject(item.id, item.data())
      );
      emit();
    },
    (error) => {
      console.error('Error subscribing owned projects:', error);
      ownedProjects = [];
      emit();
    }
  );

  const unsubMember = onSnapshot(
    memberQuery,
    (snapshot) => {
      memberProjects = snapshot.docs.map((item) =>
        normalizeProject(item.id, item.data())
      );
      emit();
    },
    (error) => {
      console.error('Error subscribing member projects:', error);
      memberProjects = [];
      emit();
    }
  );

  return () => {
    unsubOwned();
    unsubMember();
  };
}
