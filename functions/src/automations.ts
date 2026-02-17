import { onDocumentUpdated, onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import axios from "axios";

const db = admin.firestore();

/**
 * Enhanced Task Update Trigger
 */
export const onTaskUpdated = onDocumentUpdated("tasks/{taskId}", async (event) => {
  const newData = event.data?.after.data();
  const oldData = event.data?.before.data();
  const taskId = event.params.taskId;

  if (!newData) return;

  // Search for automations matching workspace or specific list/space
  const automations = await getMatchingAutomations(newData.workspaceId, newData.listId, newData.spaceId);
  
  for (const automation of automations) {
    if (checkTaskTrigger(automation.trigger, newData, oldData)) {
      await executeActions(automation, taskId, "task", newData);
    }
  }
});

/**
 * Document Created Trigger
 */
export const onDocCreated = onDocumentCreated("documents/{docId}", async (event) => {
  const data = event.data?.data();
  if (!data) return;

  const automations = await getMatchingAutomations(data.workspaceId, data.listId, data.spaceId);
  
  for (const automation of automations) {
    if (automation.trigger.type === "document_created") {
      await executeActions(automation, event.params.docId, "document", data);
    }
  }
});

async function getMatchingAutomations(workspaceId: string, listId?: string, spaceId?: string) {
  let q = db.collection("automations")
    .where("workspaceId", "==", workspaceId)
    .where("active", "==", true);
  
  const snap = await q.get();
  const results = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

  // Filter by hierarchy if specified in automation
  return results.filter((a: any) => {
    if (a.listId && a.listId !== listId) return false;
    if (a.spaceId && a.spaceId !== spaceId) return false;
    return true;
  });
}

function checkTaskTrigger(trigger: any, newData: any, oldData: any) {
  switch (trigger.type) {
    case "status_changed":
      if (newData.status === oldData?.status) return false;
      return !trigger.config?.status || newData.status === trigger.config.status;
    case "priority_changed":
      return newData.priority !== oldData?.priority;
    default:
      return false;
  }
}

async function executeActions(automation: any, entityId: string, entityType: string, entityData: any) {
  try {
    for (const action of automation.actions) {
      await runAction(action, entityId, entityType, entityData);
    }
    await logAutomation(automation, entityId, "success", "Executed successfully");
  } catch (err: any) {
    await logAutomation(automation, entityId, "error", err.message);
  }
}

async function runAction(action: any, entityId: string, entityType: string, entityData: any) {
  const entityRef = db.collection(entityType === "task" ? "tasks" : "documents").doc(entityId);

  switch (action.type) {
    case "update_status":
      await entityRef.update({ status: action.config.value });
      break;
    case "add_comment":
      await db.collection("comments").add({
        [entityType === "task" ? "taskId" : "documentId"]: entityId,
        userId: "system-automation",
        userName: "Bot de Automação",
        content: action.config.template || action.config.value,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      break;
    case "send_webhook":
      if (action.config.url) {
        await axios.post(action.config.url, {
          event: "automation_triggered",
          automationName: action.name,
          entityType,
          entityId,
          data: entityData
        });
      }
      break;
    // Add more as needed
  }
}

async function logAutomation(automation: any, entityId: string, status: string, details: string) {
  await db.collection("automation_logs").add({
    automationId: automation.id,
    automationName: automation.name,
    status,
    details,
    entityId,
    executedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  
  await db.collection("automations").doc(automation.id).update({
    lastRunAt: admin.firestore.FieldValue.serverTimestamp()
  });
}
