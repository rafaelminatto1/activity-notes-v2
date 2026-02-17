import { onDocumentWritten } from "firebase-functions/v2/firestore";
import * as functions from "firebase-functions"; // For config
import { algoliasearch } from "algoliasearch";

// Initialize Algolia
const ALGOLIA_APP_ID = functions.config().algolia?.app_id || process.env.ALGOLIA_APP_ID;
const ALGOLIA_ADMIN_KEY = functions.config().algolia?.admin_key || process.env.ALGOLIA_ADMIN_KEY;

if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_KEY) {
  console.warn("Algolia credentials not configured in Cloud Functions.");
}

const client = algoliasearch(ALGOLIA_APP_ID || "", ALGOLIA_ADMIN_KEY || "");

// --- Documents Sync ---

export const onDocumentWrite = onDocumentWritten("documents/{docId}", async (event) => {
    const docId = event.params.docId;
    const change = event.data;

    if (!change) return; // Should not happen for onWritten but for safety

    if (!change.after.exists) {
      // Deleted
      try {
        await client.deleteObject({ indexName: "activity_notes_unified", objectID: docId });
      } catch (e) {
        console.error("Error deleting from Algolia", e);
      }
      return;
    }

    const data = change.after.data();
    if (!data) return;

    const record = {
      objectID: docId,
      type: "document",
      title: data.title,
      content: data.plainText || "", 
      icon: data.icon,
      projectId: data.projectId,
      workspaceId: data.workspaceId,
      userId: data.userId,
      createdAt: data.createdAt?.toMillis(),
      updatedAt: data.updatedAt?.toMillis(),
      path: data.path || [], 
      url: `/documents/${docId}`
    };

    try {
      await client.saveObject({ indexName: "activity_notes_unified", body: record });
    } catch (e) {
      console.error("Error saving to Algolia", e);
    }
});

// --- Tasks Sync ---

export const onTaskWrite = onDocumentWritten("tasks/{taskId}", async (event) => {
    const taskId = event.params.taskId;
    const change = event.data;
    if (!change) return;

    if (!change.after.exists) {
      try {
        await client.deleteObject({ indexName: "activity_notes_unified", objectID: taskId });
      } catch (e) {
        console.error("Error deleting task from Algolia", e);
      }
      return;
    }

    const data = change.after.data();
    if (!data) return;

    const record = {
      objectID: taskId,
      type: "task",
      title: data.content, 
      status: data.status,
      projectId: data.projectId,
      assigneeId: data.assigneeId,
      userId: data.userId, 
      createdAt: data.createdAt?.toMillis(),
      updatedAt: data.updatedAt?.toMillis(),
      url: `/projects/${data.projectId}?task=${taskId}` 
    };

    try {
      await client.saveObject({ indexName: "activity_notes_unified", body: record });
    } catch (e) {
      console.error("Error saving task to Algolia", e);
    }
});

// --- Chat Messages (Comments) Sync ---

export const onMessageWrite = onDocumentWritten("chats/{channelId}/messages/{messageId}", async (event) => {
    const { channelId, messageId } = event.params;
    const change = event.data;
    if (!change) return;

    if (!change.after.exists) {
      try {
        await client.deleteObject({ indexName: "activity_notes_unified", objectID: messageId });
      } catch (e) {
        console.error("Error deleting message from Algolia", e);
      }
      return;
    }

    const data = change.after.data();
    if (!data) return;

    const record = {
      objectID: messageId,
      type: "comment",
      content: data.text,
      channelId: channelId,
      userId: data.userId,
      userName: data.userName,
      createdAt: data.createdAt?.toMillis(),
      url: `/projects/${data.projectId || "unknown"}/chat` 
    };

    try {
      await client.saveObject({ indexName: "activity_notes_unified", body: record });
    } catch (e) {
      console.error("Error saving message to Algolia", e);
    }
});
