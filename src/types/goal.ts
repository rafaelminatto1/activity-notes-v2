import { Timestamp } from "firebase/firestore";

export type KeyResultType = "number" | "percentage" | "tasks";

export interface KeyResult {
  id: string;
  title: string;
  type: KeyResultType;
  currentValue: number;
  targetValue: number;
  unit?: string;
  linkedTaskIds?: string[]; // If type is "tasks"
  progress: number; // 0 to 100
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  ownerId: string;
  projectId?: string; // Optional: link to a project
  period: string; // e.g., "Q1 2026"
  color: string; // hex color
  keyResults: KeyResult[];
  progress: number; // Overall progress (average of KRs)
  status: "active" | "completed" | "archived";
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
