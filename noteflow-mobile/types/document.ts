export interface Document {
  id: string;
  title: string;
  content: Record<string, unknown> | null;
  plainText: string;
  icon: string;
  color: string;
  coverImage: string;
  workspaceId: string | null;
  projectId: string | null;
  parentDocumentId: string | null;
  userId: string;
  allowedUserIds: string[];
  isArchived: boolean;
  isPublished: boolean;
  isFavorite: boolean;
  position: number;
  childCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentCreate {
  title?: string;
  parentDocumentId?: string | null;
  icon?: string;
  color?: string;
  workspaceId?: string | null;
  projectId?: string | null;
  allowedUserIds?: string[];
}

export type DocumentUpdate = Partial<Omit<Document, 'id' | 'userId' | 'createdAt'>>;
