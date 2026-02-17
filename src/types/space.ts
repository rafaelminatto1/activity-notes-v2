import { Timestamp } from "firebase/firestore";

export interface Space {
  id: string;
  name: string;
  icon: string;
  color: string;
  userId: string;
  isPrivate: boolean;
  memberIds?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SpaceCreate {
  name: string;
  icon: string;
  color: string;
  userId: string;
  isPrivate: boolean;
}

export type SpaceUpdate = Partial<SpaceCreate>;
