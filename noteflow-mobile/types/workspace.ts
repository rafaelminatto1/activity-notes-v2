export interface Workspace {
  id: string;
  name: string;
  icon: string;
  ownerId: string;
  members: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceCreateInput {
  name: string;
  icon: string;
  members?: string[];
}

export interface WorkspaceUpdateInput {
  name?: string;
  icon?: string;
  members?: string[];
}

export interface WorkspaceMember {
  uid: string;
  email: string;
  displayName: string;
  role: 'owner' | 'member';
  invitationId?: string;
  joinedAt: Date;
}

export interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  workspaceName: string;
  workspaceIcon: string;
  invitedEmail: string;
  invitedBy: string;
  invitedByName: string;
  status: 'pending' | 'accepted' | 'declined' | 'canceled';
  acceptedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}
