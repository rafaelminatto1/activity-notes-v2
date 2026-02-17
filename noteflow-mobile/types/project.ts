export type ProjectKind = 'folder' | 'notebook' | 'shared-project';
export type ProjectVisibility = 'private' | 'shared';

export interface Project {
  id: string;
  name: string;
  icon: string;
  color: string;
  kind: ProjectKind;
  visibility: ProjectVisibility;
  userId: string;
  workspaceId: string | null;
  memberIds: string[];
  documentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectCreateInput {
  name: string;
  icon: string;
  color: string;
  kind: ProjectKind;
  visibility: ProjectVisibility;
  workspaceId?: string | null;
  memberIds?: string[];
}

export interface ProjectUpdateInput {
  name?: string;
  icon?: string;
  color?: string;
  kind?: ProjectKind;
  visibility?: ProjectVisibility;
  workspaceId?: string | null;
  memberIds?: string[];
}
