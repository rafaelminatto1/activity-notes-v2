import { Timestamp } from "firebase/firestore";

export interface Space {
  id: string;
  name: string;
  icon: string;
  color: string;
  userId: string;
  isPrivate: boolean;
  memberIds?: string[];
  order?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SpaceCreate {
  name: string;
  icon: string;
  color: string;
  userId: string;
  isPrivate: boolean;
  order?: number;
}

export type SpaceUpdate = Partial<SpaceCreate>;
