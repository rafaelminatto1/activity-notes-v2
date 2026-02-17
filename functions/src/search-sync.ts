import { onDocumentWritten } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import { algoliasearch } from "algoliasearch";

const db = admin.firestore();

// Initialize Algolia
const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID || "";
const ALGOLIA_ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY || "";
const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY);

/**
 * Sync Documents to Algolia
 */
export const syncDocumentToSearch = onDocumentWritten("documents/{docId}", async (event) => {
  const indexName = "documents";
  const docId = event.params.docId;
  const snap = event.data?.after;

  if (!snap || !snap.exists) {
    // Deleted
    await client.deleteObject({ indexName, objectID: docId });
    return;
  }

  const data = snap.data();
  if (!data || data.isArchived || !data.userId) {
    await client.deleteObject({ indexName, objectID: docId });
    return;
  }

  // Update index
  await client.saveObject({
    indexName,
    body: {
      objectID: docId,
      title: data.title,
      plainText: data.plainText?.slice(0, 5000),
      userId: data.userId,
      workspaceId: data.workspaceId,
      type: data.type || "document",
      updatedAt: data.updatedAt?.toMillis(),
    }
  });
});

/**
 * Sync Tasks to Algolia
 */
export const syncTaskToSearch = onDocumentWritten("tasks/{taskId}", async (event) => {
  const indexName = "tasks";
  const taskId = event.params.taskId;
  const snap = event.data?.after;

  if (!snap || !snap.exists) {
    await client.deleteObject({ indexName, objectID: taskId });
    return;
  }

  const data = snap.data();
  if (!data) return;

  await client.saveObject({
    indexName,
    body: {
      objectID: taskId,
      title: data.title,
      status: data.status,
      priority: data.priority,
      userId: data.userId,
      projectId: data.projectId,
      updatedAt: data.updatedAt?.toMillis(),
    }
  });
});
