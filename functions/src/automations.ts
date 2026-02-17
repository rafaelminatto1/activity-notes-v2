import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * Triggered when a task is updated.
 * Checks for matching automations and executes actions.
 */
export const onTaskUpdated = onDocumentUpdated("tasks/{taskId}", async (event) => {
  const newData = event.data?.after.data();
  const oldData = event.data?.before.data();
  const taskId = event.params.taskId;

  if (!newData || !newData.projectId) return;

  // 1. Fetch active automations for this project
  const automationsSnap = await db
    .collection("automations")
    .where("projectId", "==", newData.projectId)
    .where("active", "==", true)
    .get();

  if (automationsSnap.empty) return;

  for (const doc of automationsSnap.docs) {
    const automation = doc.data();
    const trigger = automation.trigger;

    let triggered = false;

    // 2. Check Triggers
    if (trigger.type === "status_changed") {
      if (newData.status !== oldData?.status) {
        if (trigger.config?.status) {
          triggered = newData.status === trigger.config.status;
        } else {
          triggered = true;
        }
      }
    } else if (trigger.type === "priority_changed") {
      triggered = newData.priority !== oldData?.priority;
    } else if (trigger.type === "assignee_changed") {
      triggered = newData.assigneeId !== oldData?.assigneeId;
    }

    // 3. Execute Actions if triggered
    if (triggered) {
      try {
        for (const action of automation.actions) {
          await executeAction(action, taskId);
        }

        // Log success
        await logExecution(automation, taskId, "success", "Automação executada com sucesso");
      } catch (error: any) {
        // Log error
        await logExecution(automation, taskId, "error", error.message || "Erro desconhecido");
      }
    }
  }
});

/**
 * Helper to execute an action on a task
 */
async function executeAction(action: any, taskId: string) {
  const taskRef = db.collection("tasks").doc(taskId);

  switch (action.type) {
    case "update_status":
      await taskRef.update({ status: action.config.value });
      break;
    case "update_priority":
      await taskRef.update({ priority: action.config.value });
      break;
    case "assign_to":
      await taskRef.update({ assigneeId: action.config.value });
      break;
    case "add_comment":
      await db.collection("comments").add({
        taskId,
        userId: "system-automation",
        content: action.config.value,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      break;
    default:
      console.warn(`Action type ${action.type} not implemented`);
  }
}

/**
 * Log automation execution
 */
async function logExecution(automation: any, taskId: string, status: string, details: string) {
  await db.collection("automation_logs").add({
    automationId: automation.id,
    automationName: automation.name,
    projectId: automation.projectId,
    taskId,
    status,
    details,
    triggerEvent: automation.trigger.type,
    executedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await db.collection("automations").doc(automation.id).update({
    lastRunAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}
