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
