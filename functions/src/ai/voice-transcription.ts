import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import * as storage from "@google-cloud/storage";
import { GoogleGenerativeAI, SchemaType, ResponseSchema } from "@google/generative-ai";

const storageClient = new storage.Storage();

/**
 * Voice Note Intelligence - Audio Transcription and Analysis
 * Uses Gemini 1.5 Flash Audio capabilities
 * Trigger: callable function
 */
const transcriptionSchema: ResponseSchema = {
  description: "Audio transcription and analysis",
  type: SchemaType.OBJECT,
  properties: {
    transcript: { type: SchemaType.STRING },
    summary: { type: SchemaType.STRING },
    actionItems: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    speakers: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    decisions: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    duration: { type: SchemaType.STRING },
  },
  required: ["transcript", "summary"],
};

export const transcribeAudioNote = functions.https.onCall(async (request) => {
  const { audioRef, documentId } = request.data as { audioRef?: string; documentId?: string };

  if (!audioRef || !documentId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Audio reference and document ID are required"
    );
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GLM_API_KEY;
  if (!apiKey) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "AI API Key is not configured."
    );
  }

  try {
    // Download audio file
    let audioPath = audioRef;
    if (!audioRef.startsWith("gs://")) {
       const bucketName = process.env.STORAGE_BUCKET || "fisioflow-migration.appspot.com";
       audioPath = "gs://" + bucketName + "/" + audioRef;
    }
    const pathParts = audioPath.split("/");
    const bucketName = pathParts[2];
    const fileName = pathParts.slice(3).join("/");
    const [file] = await storageClient.bucket(bucketName).file(fileName).download();
    
    // Convert to base64
    const base64Audio = file.toString("base64");
    
    // Determine mime type (simple check)
    const mimeType = fileName.endsWith(".mp3") ? "audio/mp3" : "audio/wav";

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: transcriptionSchema,
      },
    });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Audio,
        },
      },
      { text: "Transcribe this audio and extract a summary, action items, speakers, and decisions." },
    ]);

    const response = result.response;
    const transcriptionData = JSON.parse(response.text());

    // Update document with transcription data
    await admin.firestore().collection("notes").doc(documentId).update({
      aiAnalysis: {
        summary: transcriptionData.summary,
        actionItems: transcriptionData.actionItems || [],
        generatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      // You might also want to save the full transcript somewhere
      plainText: (transcriptionData.transcript || ""),
    });

    return {
      success: true,
      data: transcriptionData,
    };
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to transcribe audio"
    );
  }
});
