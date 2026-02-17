import { Timestamp } from "firebase/firestore";

export interface Portfolio {
  id: string;
  name: string;
  description?: string;
  projectIds: string[];
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ProjectProgress {
  projectId: string;
  name: string;
  status: "on_track" | "at_risk" | "off_track" | "completed";
  progress: number; // percentage 0-100
  startDate?: Timestamp;
  endDate?: Timestamp;
  ownerName?: string;
  taskStats: {
    total: number;
    todo: number;
    in_progress: number;
    done: number;
  };
}
