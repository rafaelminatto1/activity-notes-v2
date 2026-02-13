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
