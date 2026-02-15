import { Timestamp } from "firebase/firestore";

/**
 * Enhanced Document type with AI and collaboration features
 * Extends the base Document type with smart capabilities
 */
export interface SmartNote {
  id: string;
  title: string;
  content: any; // JSONContent from Tiptap
  plainText: string;
  icon: string;
  coverImage: string;
  workspaceId: string;
  parentDocumentId: string | null;
  userId: string;
  isArchived: boolean;
  isPublished: boolean;
  position: number;
  childCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // AI Features
  aiAnalysis?: AIAnalysis;
  vectorEmbedding?: number[]; // For semantic search
  tags?: string[]; // AI-generated tags
  aiSummary?: string; // AI-generated summary
  category?: string; // AI-generated category

  // Collaboration Features
  collaborators?: string[]; // User IDs with edit access
  sharedWith?: "public" | "comment-only" | "owner-only";
  sharedAt?: Timestamp;

  // Version History
  versionCount?: number;
  currentVersion?: number;

  // Task Management
  hasTasks?: boolean;
  taskCount?: number;

  // Related Notes
  relatedNotes?: string[]; // IDs of semantically related notes

  // Verification
  verifiedAt?: Timestamp;
  verifiedBy?: string;
}

/**
 * AI Analysis metadata
 */
export interface AIAnalysis {
  summary: string;
  actionItems: string[];
  keyPoints: string[];
  sentiment: "positive" | "neutral" | "negative";
  language: string;
  topics: string[];
  suggestedTags: string[];
  generatedAt: Timestamp;
}

/**
 * Tag system
 */
export interface Tag {
  id: string;
  name: string;
  color: string;
  icon: string;
  userId: string;
  useCount: number;
  createdAt: Timestamp;
}

/**
 * Template
 */
export interface Template {
  id: string;
  name: string;
  description: string;
  content: any; // Tiptap JSON content
  icon: string;
  category: string;
  userId: string;
  isPublic: boolean;
  usageCount: number;
  createdAt: Timestamp;
}

export type TaskStatus = "todo" | "in_progress" | "done" | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

/**
 * Task (independent or embedded in notes)
 */
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Timestamp;
  assigneeId?: string;
  documentId?: string; // If embedded in a note
  userId: string;
  completedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  labels?: string[]; // Additional labels
}

/**
 * Document Version
 */
export interface DocumentVersion {
  id: string;
  documentId: string;
  content: any; // Tiptap JSON content
  plainText: string;
  version: number;
  createdBy: string;
  createdAt: Timestamp;
}

/**
 * Comment/Annotation
 */
export interface Comment {
  id: string;
  documentId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  parentId?: string; // For threaded comments
  selection?: {
    from: number;
    to: number;
    text?: string; // The text being commented on
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Reminder
 */
export interface Reminder {
  id: string;
  documentId?: string;
  taskId?: string;
  title: string;
  description: string;
  dueDate: Timestamp;
  completed: boolean;
  userId: string;
  createdAt: Timestamp;
  completedAt?: Timestamp;
}

/**
 * Embedding for semantic search
 */
export interface Embedding {
  id: string;
  documentId: string;
  vector: number[]; // Float array from embedding model
  model: string; // Which model generated this embedding
  updatedAt: Timestamp;
}

/**
 * Workspace Analytics
 */
export interface WorkspaceAnalytics {
  userId: string;
  period: "daily" | "weekly" | "monthly";
  stats: {
    documentsCreated: number;
    documentsUpdated: number;
    aiActionsUsed: number;
    searchQueries: number;
    topPages: string[]; // Most visited document IDs
    mostUsedTags: string[];
    activeCollaborators: number;
  };
  updatedAt: Timestamp;
}

/**
 * Web Clipper result
 */
export interface WebClip {
  id: string;
  url: string;
  title: string;
  description: string;
  imageUrl?: string;
  favicon?: string;
  userId: string;
  documentId?: string; // If saved as a note
  createdAt: Timestamp;
}
