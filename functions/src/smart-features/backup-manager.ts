import { onSchedule } from "firebase-functions/v2/scheduler";
import { v1 } from "@google-cloud/firestore";
import { logger } from "firebase-functions";

const client = new v1.FirestoreAdminClient();

/**
 * Scheduled Firestore Backup
 * Runs every day at 03:00 AM (America/Sao_Paulo)
 * Exports the entire default database to the specified backup bucket
 */
export const scheduledFirestoreBackup = onSchedule(
  {
    schedule: "every day 03:00",
    timeZone: "America/Sao_Paulo",
    memory: "512MiB",
  },
  async (event) => {
    // Note: The backup bucket should be configured in an environment variable or secret
    // Defaulting to the standard app-spot bucket if not provided
    const projectId = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT || "fisioflow-migration";
    const databaseName = client.databasePath(projectId, "(default)");
    
    // It's recommended to create a dedicated bucket for backups (e.g., gs://PROJECT_ID-backups)
    // Here we use a folder named 'backups' in the default storage bucket
    const bucketName = process.env.BACKUP_BUCKET || `gs://${projectId}.firebasestorage.app/backups`;

    try {
      const [operation] = await client.exportDocuments({
        name: databaseName,
        outputUriPrefix: bucketName,
        collectionIds: [], // Empty means all collections
      });

      logger.info(`[Backup] Export operation started: ${operation.name}`);
      logger.info(`[Backup] Destination: ${bucketName}`);
    } catch (error) {
      logger.error("[Backup] Export operation failed:", error);
    }
  }
);
