import { Timestamp } from "firebase/firestore";
import { JSONContent } from "@tiptap/react";

export interface Document {
  id: string;
  title: string;
  content: JSONContent | null;
  plainText: string;
  icon: string;
  coverImage: string;
  workspaceId: string;
  parentDocumentId: string | null;
  userId: string;
  isArchived: boolean;
  isPublished: boolean;
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
