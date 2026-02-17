import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { Project, ProjectKind } from '@/types/project';
import { Workspace, WorkspaceInvitation } from '@/types/workspace';
import {
  acceptWorkspaceInvitation,
  cancelWorkspaceInvitation,
  createProject,
  createWorkspace,
  declineWorkspaceInvitation,
  deleteProject,
  deleteWorkspace,
  getWorkspaceInvitationById,
  inviteWorkspaceMemberByEmail,
  removeWorkspaceMember,
  subscribeToInvitationsByEmail,
  subscribeToUserProjects,
  subscribeToUserWorkspaces,
} from '@/lib/firebase/spaces';

interface CreatePersonalProjectData {
  name: string;
  icon: string;
  color: string;
  kind: Exclude<ProjectKind, 'shared-project'>;
}

interface CreateSharedProjectData {
  name: string;
  icon: string;
  color: string;
  workspaceId: string | null;
  extraMemberIds?: string[];
}

interface CreateWorkspaceData {
  name: string;
  icon: string;
  members?: string[];
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => !!value.trim())));
}

export function useSpaces() {
  const { user, profile } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [incomingInvitations, setIncomingInvitations] = useState<WorkspaceInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setProjects([]);
      setWorkspaces([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    let loadedProjects = false;
    let loadedWorkspaces = false;
    const markLoaded = () => {
      if (loadedProjects && loadedWorkspaces) setIsLoading(false);
    };

    const unsubProjects = subscribeToUserProjects(user.uid, (nextProjects) => {
      loadedProjects = true;
      setProjects(nextProjects);
      markLoaded();
    });
    const unsubWorkspaces = subscribeToUserWorkspaces(user.uid, (nextWorkspaces) => {
      loadedWorkspaces = true;
      setWorkspaces(nextWorkspaces);
      markLoaded();
    });

    return () => {
      unsubProjects();
      unsubWorkspaces();
    };
  }, [user?.uid]);

  useEffect(() => {
    const email = (profile?.email || user?.email || '').trim().toLowerCase();
    if (!user?.uid || !email) {
      setIncomingInvitations([]);
      return;
    }

    const unsubscribe = subscribeToInvitationsByEmail(email, setIncomingInvitations);
    return unsubscribe;
  }, [profile?.email, user?.email, user?.uid]);

  const personalProjects = useMemo(() => {
    if (!user?.uid) return [];
    return projects.filter(
      (project) =>
        project.userId === user.uid &&
        project.visibility !== 'shared' &&
        !project.workspaceId
    );
  }, [projects, user?.uid]);

  const sharedProjects = useMemo(() => {
    if (!user?.uid) return [];
    return projects.filter((project) => {
      const isOwnedPrivate =
        project.userId === user.uid &&
        project.visibility !== 'shared' &&
        !project.workspaceId;
      return !isOwnedPrivate;
    });
  }, [projects, user?.uid]);

  const createPersonalProject = useCallback(
    async (data: CreatePersonalProjectData) => {
      if (!user?.uid) throw new Error('Not authenticated');
      return createProject(user.uid, {
        name: data.name,
        icon: data.icon,
        color: data.color,
        kind: data.kind,
        visibility: 'private',
        workspaceId: null,
        memberIds: [user.uid],
      });
    },
    [user?.uid]
  );

  const createSharedProject = useCallback(
    async (data: CreateSharedProjectData) => {
      if (!user?.uid) throw new Error('Not authenticated');
      const workspace = data.workspaceId
        ? workspaces.find((item) => item.id === data.workspaceId)
        : null;
      const memberIds = uniqueStrings([
        user.uid,
        ...(workspace?.members || []),
        ...(data.extraMemberIds || []),
      ]);

      return createProject(user.uid, {
        name: data.name,
        icon: data.icon,
        color: data.color,
        kind: 'shared-project',
        visibility: 'shared',
        workspaceId: data.workspaceId,
        memberIds,
      });
    },
    [user?.uid, workspaces]
  );

  const createTeamWorkspace = useCallback(
    async (data: CreateWorkspaceData) => {
      if (!user?.uid) throw new Error('Not authenticated');
      return createWorkspace(user.uid, {
        name: data.name,
        icon: data.icon,
        members: uniqueStrings([...(data.members || []), user.uid]),
      }, {
        email: profile?.email || user.email || '',
        displayName: profile?.displayName || user.displayName || 'Owner',
      });
    },
    [profile?.displayName, profile?.email, user?.displayName, user?.email, user?.uid]
  );

  const removeProject = useCallback(async (projectId: string) => {
    await deleteProject(projectId);
  }, []);

  const removeWorkspace = useCallback(async (workspaceId: string) => {
    await deleteWorkspace(workspaceId);
  }, []);

  const inviteMemberByEmail = useCallback(
    async (workspaceId: string, invitedEmail: string) => {
      if (!user?.uid) throw new Error('Not authenticated');
      const workspace = workspaces.find((item) => item.id === workspaceId);
      if (!workspace) throw new Error('Workspace not found');

      await inviteWorkspaceMemberByEmail({
        workspace,
        invitedEmail,
        invitedBy: user.uid,
        invitedByName:
          profile?.displayName || user.displayName || user.email || 'Membro',
      });
    },
    [profile?.displayName, user?.displayName, user?.email, user?.uid, workspaces]
  );

  const acceptInvitation = useCallback(
    async (invitation: WorkspaceInvitation) => {
      if (!user?.uid) throw new Error('Not authenticated');
      const email = (profile?.email || user.email || '').trim();
      if (!email) throw new Error('User email not available');

      await acceptWorkspaceInvitation({
        invitation,
        userId: user.uid,
        email,
        displayName: profile?.displayName || user.displayName || 'Membro',
      });
    },
    [profile?.displayName, profile?.email, user?.displayName, user?.email, user?.uid]
  );

  const acceptInvitationById = useCallback(
    async (invitationId: string) => {
      const invitation = await getWorkspaceInvitationById(invitationId);
      if (!invitation) throw new Error('Invitation not found');
      await acceptInvitation(invitation);
    },
    [acceptInvitation]
  );

  const declineInvitation = useCallback(async (invitationId: string) => {
    await declineWorkspaceInvitation(invitationId);
  }, []);

  const cancelInvitation = useCallback(async (invitationId: string) => {
    await cancelWorkspaceInvitation(invitationId);
  }, []);

  const removeMember = useCallback(async (workspaceId: string, memberId: string) => {
    await removeWorkspaceMember(workspaceId, memberId);
  }, []);

  return {
    projects,
    workspaces,
    incomingInvitations,
    personalProjects,
    sharedProjects,
    isLoading,
    createPersonalProject,
    createSharedProject,
    createTeamWorkspace,
    removeProject,
    removeWorkspace,
    inviteMemberByEmail,
    acceptInvitation,
    acceptInvitationById,
    declineInvitation,
    cancelInvitation,
    removeMember,
  };
}
