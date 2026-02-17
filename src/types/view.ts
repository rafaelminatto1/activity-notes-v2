import { Timestamp } from "firebase/firestore";

export type FilterOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "is_empty"
  | "is_not_empty"
  | "greater_than"
  | "less_than"
  | "before"
  | "after";

export type FilterLogic = "AND" | "OR";

export interface FilterRule {
  id: string;
  field: string;
  operator: FilterOperator;
  value: any;
}

export interface FilterGroup {
  id: string;
  logic: FilterLogic;
  rules: (FilterRule | FilterGroup)[];
}

export interface SavedView {
  id: string;
  name: string;
  icon?: string;
  userId: string;
  projectId?: string;
  type: "tasks" | "documents";
  filters: FilterGroup;
  sortBy: string;
  sortDir: "asc" | "desc";
  isDefault?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
