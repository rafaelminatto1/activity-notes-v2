import { Timestamp } from "firebase/firestore";
import { JSONContent } from "@tiptap/react";

export interface AnnotationLayer {
  page: number;
  objects: Record<string, unknown>[];
  version: string;
}

export interface Document {
  id: string;
  title: string;
  type: "document" | "canvas";
  content: JSONContent | null;
  canvasData?: {
    nodes: any[];
    edges: any[];
    viewport?: { x: number; y: number; zoom: number };
  };
  plainText: string;
  summary?: string;
  location?: { latitude: number; longitude: number };
  icon: string;
  color: string;
  coverImage: string;
  workspaceId: string;
  projectId: string | null;
  spaceId?: string | null;
  folderId?: string | null;
  listId?: string | null;
  parentDocumentId: string | null;
  userId: string;
  isArchived: boolean;
  isPublished: boolean;
  sourceUrl?: string;
  tags?: string[];
  position: number;
  childCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type DocumentCreate = Omit<
  Document,
  "id" | "createdAt" | "updatedAt"
>;

export type DocumentUpdate = Partial<
  Omit<Document, "id" | "userId" | "createdAt">
>;
