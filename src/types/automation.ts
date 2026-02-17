import { Timestamp } from "firebase/firestore";

export type TriggerType =
  | "task_created"
  | "status_changed"
  | "priority_changed"
  | "assignee_changed"
  | "comment_added"
  | "due_date_reached";

export type ActionType =
  | "update_status"
  | "update_priority"
  | "assign_to"
  | "add_comment"
  | "send_notification"
  | "create_subtask"
  | "add_tag"
  | "remove_tag";

export interface AutomationTrigger {
  type: TriggerType;
  config: Record<string, any>; // e.g., { status: 'done' }
}

export interface AutomationAction {
  id: string;
  type: ActionType;
  config: Record<string, any>; // e.g., { assigneeId: 'user123' }
}

export interface Automation {
  id: string;
  name: string;
  projectId: string;
  userId: string;
  active: boolean;
  trigger: AutomationTrigger;
  actions: AutomationAction[];
  lastRunAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AutomationLog {
  id: string;
  automationId: string;
  automationName: string;
  triggerEvent: string;
  status: "success" | "error";
  details: string;
  executedAt: Timestamp;
}
