import { Timestamp } from "firebase/firestore";

export type TriggerType = 
  | "task_created" 
  | "status_changed" 
  | "priority_changed" 
  | "assignee_changed"
  | "document_created" 
  | "comment_added";

export type ActionType = 
  | "update_status" 
  | "update_priority" 
  | "assign_to" 
  | "add_comment" 
  | "add_tag"
  | "send_notification" 
  | "send_webhook"
  | "ai_summarize";

export interface AutomationTrigger {
  type: TriggerType;
  config?: {
    status?: string;
    priority?: string;
    field?: string;
    matchValue?: unknown;
  };
}

export interface AutomationAction {
  id?: string; // Optional for UI tracking
  type: ActionType;
  config: {
    value?: unknown;
    url?: string; // For webhooks
    template?: string; // For messages/comments
  };
}

export interface Automation {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  spaceId?: string;
  listId?: string;
  projectId?: string; // Legacy support
  active: boolean;
  trigger: AutomationTrigger;
  actions: AutomationAction[];
  lastRunAt?: Timestamp;
  createdAt: Timestamp;
  createdBy: string;
}

export interface AutomationLog {
  id: string;
  automationId: string;
  automationName: string;
  status: "success" | "error";
  details: string;
  executedAt: Timestamp;
  triggerEvent: string;
  entityId: string; // Task ID or Doc ID
}
