import { Timestamp } from "firebase/firestore";

export interface List {
  id: string;
  spaceId: string;
  folderId: string | null; // Can be directly in Space or in Folder
  name: string;
  icon: string;
  color: string;
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  viewType: "list" | "board" | "calendar" | "gantt"; // Default view
}

export interface ListCreate {
  spaceId: string;
  folderId?: string | null;
  name: string;
  icon: string;
  color: string;
  userId: string;
  viewType?: "list" | "board" | "calendar" | "gantt";
}

export type ListUpdate = Partial<ListCreate>;
