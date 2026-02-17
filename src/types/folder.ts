import { Timestamp } from "firebase/firestore";

export interface Folder {
  id: string;
  spaceId: string;
  name: string;
  icon: string;
  color: string;
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FolderCreate {
  spaceId: string;
  name: string;
  icon: string;
  color: string;
  userId: string;
}

export type FolderUpdate = Partial<FolderCreate>;
