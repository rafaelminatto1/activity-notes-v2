export interface Document {
  id: string;
  title: string;
  content: Record<string, unknown> | null;
  plainText: string;
  icon: string;
  coverImage: string;
  parentDocumentId: string | null;
  userId: string;
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
}

export type DocumentUpdate = Partial<Omit<Document, 'id' | 'userId' | 'createdAt'>>;
