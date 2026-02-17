import {
  collection,
  onSnapshot,
  query,
  where,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export type SearchRecordType = "document" | "task" | "comment";

export interface RealtimeSearchRecord {
  objectID: string;
  type: SearchRecordType;
  title?: string;
  content?: string;
  icon?: string;
  path?: string[];
  pathText?: string;
  url: string;
  createdAt: number;
  status?: string;
  userName?: string;
}

export interface RealtimeSearchState {
  records: RealtimeSearchRecord[];
  isReady: boolean;
}

interface IndexedDocument {
  id: string;
  title: string;
  plainText: string;
  icon: string;
  parentDocumentId: string | null;
  createdAt: number;
  isArchived: boolean;
}

interface IndexedTask {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  documentId: string | null;
  createdAt: number;
}

interface IndexedComment {
  id: string;
  content: string;
  userName: string;
  documentId: string | null;
  createdAt: number;
}

function toStringSafe(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function toNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function toBooleanSafe(value: unknown): boolean {
  return value === true;
}

function toMillisSafe(value: unknown): number {
  if (!value || typeof value !== "object") {
    return 0;
  }

  const timestamp = value as { toMillis?: () => number; seconds?: number };
  if (typeof timestamp.toMillis === "function") {
    return timestamp.toMillis();
  }
  if (typeof timestamp.seconds === "number") {
    return timestamp.seconds * 1000;
  }
  return 0;
}

function mapDocument(id: string, data: DocumentData): IndexedDocument {
  return {
    id,
    title: toStringSafe(data.title),
    plainText: toStringSafe(data.plainText),
    icon: toStringSafe(data.icon),
    parentDocumentId: toNullableString(data.parentDocumentId),
    createdAt: toMillisSafe(data.createdAt),
    isArchived: toBooleanSafe(data.isArchived),
  };
}

function mapTask(id: string, data: DocumentData): IndexedTask {
  return {
    id,
    title: toStringSafe(data.title),
    description: toStringSafe(data.description),
    status: toStringSafe(data.status),
    priority: toStringSafe(data.priority),
    documentId: toNullableString(data.documentId),
    createdAt: toMillisSafe(data.createdAt),
  };
}

function mapComment(id: string, data: DocumentData): IndexedComment {
  return {
    id,
    content: toStringSafe(data.content),
    userName: toStringSafe(data.userName),
    documentId: toNullableString(data.documentId),
    createdAt: toMillisSafe(data.createdAt),
  };
}

function buildDocumentPathMap(documents: IndexedDocument[]): Map<string, string[]> {
  const byId = new Map(documents.map((document) => [document.id, document]));
  const pathMap = new Map<string, string[]>();

  const resolvePath = (document: IndexedDocument): string[] => {
    const cachedPath = pathMap.get(document.id);
    if (cachedPath) return cachedPath;

    const visited = new Set<string>([document.id]);
    const parentTitles: string[] = [];
    let cursor = document.parentDocumentId;
    let depth = 0;

    while (cursor && depth < 24) {
      if (visited.has(cursor)) break;
      visited.add(cursor);

      const parent = byId.get(cursor);
      if (!parent) break;

      parentTitles.push(parent.title || "Sem título");
      cursor = parent.parentDocumentId;
      depth += 1;
    }

    parentTitles.reverse();
    pathMap.set(document.id, parentTitles);
    return parentTitles;
  };

  documents.forEach((document) => {
    resolvePath(document);
  });

  return pathMap;
}

export function subscribeToRealtimeSearchIndex(
  userId: string,
  callback: (state: RealtimeSearchState) => void
): () => void {
  if (!db) {
    callback({ records: [], isReady: true });
    return () => {};
  }

  callback({ records: [], isReady: false });

  let documentRecords: RealtimeSearchRecord[] = [];
  let taskRecords: RealtimeSearchRecord[] = [];
  let commentRecords: RealtimeSearchRecord[] = [];

  let isDocumentsReady = false;
  let isTasksReady = false;
  let isCommentsReady = false;

  const emit = () => {
    callback({
      records: [...documentRecords, ...taskRecords, ...commentRecords],
      isReady: isDocumentsReady && isTasksReady && isCommentsReady,
    });
  };

  const documentsQuery = query(
    collection(db, "documents"),
    where("userId", "==", userId)
  );

  const tasksQuery = query(
    collection(db, "tasks"),
    where("userId", "==", userId)
  );

  const commentsQuery = query(
    collection(db, "comments"),
    where("userId", "==", userId)
  );

  const unsubscribeDocuments = onSnapshot(
    documentsQuery,
    (snapshot) => {
      const documents = snapshot.docs
        .map((snap) => mapDocument(snap.id, snap.data()))
        .filter((document) => !document.isArchived);
      const pathMap = buildDocumentPathMap(documents);

      documentRecords = documents.map((document) => {
        const path = pathMap.get(document.id) ?? [];
        return {
          objectID: `document:${document.id}`,
          type: "document",
          title: document.title || "Sem título",
          content: document.plainText,
          icon: document.icon,
          path,
          pathText: path.join(" > "),
          url: `/documents/${document.id}`,
          createdAt: document.createdAt,
        };
      });

      isDocumentsReady = true;
      emit();
    },
    (error) => {
      console.error("Erro ao sincronizar documentos para busca:", error);
      isDocumentsReady = true;
      emit();
    }
  );

  const unsubscribeTasks = onSnapshot(
    tasksQuery,
    (snapshot) => {
      taskRecords = snapshot.docs.map((snap) => {
        const task = mapTask(snap.id, snap.data());
        const taskContext = [task.description, task.priority]
          .filter(Boolean)
          .join(" ");
        return {
          objectID: `task:${task.id}`,
          type: "task",
          title: task.title || "Sem título",
          content: taskContext,
          status: task.status,
          url: task.documentId ? `/documents/${task.documentId}` : "/documents",
          createdAt: task.createdAt,
        };
      });

      isTasksReady = true;
      emit();
    },
    (error) => {
      console.error("Erro ao sincronizar tarefas para busca:", error);
      isTasksReady = true;
      emit();
    }
  );

  const unsubscribeComments = onSnapshot(
    commentsQuery,
    (snapshot) => {
      commentRecords = snapshot.docs.map((snap) => {
        const comment = mapComment(snap.id, snap.data());
        return {
          objectID: `comment:${comment.id}`,
          type: "comment",
          content: comment.content,
          userName: comment.userName,
          url: comment.documentId
            ? `/documents/${comment.documentId}?comment=${comment.id}`
            : "/documents",
          createdAt: comment.createdAt,
        };
      });

      isCommentsReady = true;
      emit();
    },
    (error) => {
      console.error("Erro ao sincronizar comentários para busca:", error);
      isCommentsReady = true;
      emit();
    }
  );

  return () => {
    unsubscribeDocuments();
    unsubscribeTasks();
    unsubscribeComments();
  };
}
