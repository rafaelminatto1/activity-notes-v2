import { Timestamp } from "firebase/firestore";

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  icon: string;
  members: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface WorkspaceMember {
  uid: string;
  email: string;
  displayName: string;
  role: "owner" | "member";
  invitationId?: string;
  joinedAt: Timestamp | null;
}

export type WorkspaceInvitationStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "canceled";

export interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  workspaceName: string;
  workspaceIcon: string;
  invitedEmail: string;
  invitedBy: string;
  invitedByName: string;
  status: WorkspaceInvitationStatus;
  acceptedBy: string | null;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface WorkspaceCreateInput {
  name: string;
  icon?: string;
  members?: string[];
}

export interface WorkspaceUpdateInput {
  name?: string;
  icon?: string;
  members?: string[];
}
