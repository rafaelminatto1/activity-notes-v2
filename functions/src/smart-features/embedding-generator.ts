import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { onDocumentCreated } from "firebase-functions/v2/firestore";

/**
 * Vector Embedding Generator for Semantic Search
 * Uses GLM Embeddings API
 * Trigger: onDocumentCreated (Firestore)
 */
export const generateEmbedding = onDocumentCreated(
  "notes/{documentId}",
  async (event) => {
    const { params } = event;
    const snapshot = event.data;
    const document = snapshot?.data();

    // Skip if no plainText or already has embedding
    if (!document?.plainText || document?.vectorEmbedding) {
      return null;
    }

    try {
      // Using GLM API for embeddings
      const response = await fetch("https://api.z.ai/api/paas/v4/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + process.env.GLM_API_KEY,
        },
        body: JSON.stringify({
          model: "glm-4-air",
          input: document.plainText.slice(0, 2000),
          encoding_format: "float",
        }),
      });

      const data = await response.json();
      const embedding = data.data?.embedding || data.data?.[0]?.embedding;

      if (!embedding || !Array.isArray(embedding)) {
        throw new Error("Invalid embedding response");
      }

      // Update document with vector embedding
      await admin.firestore().collection("notes").doc(params.documentId).update({
        vectorEmbedding: embedding,
      });

      console.log("Generated embedding for document " + params.documentId);
      return null;
    } catch (error) {
      console.error("Error generating embedding:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to generate embedding"
      );
    }
  }
);
