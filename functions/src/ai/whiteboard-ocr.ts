import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import * as storage from "@google-cloud/storage";
import { GoogleGenerativeAI, SchemaType, ResponseSchema } from "@google/generative-ai";

const storageClient = new storage.Storage();

/**
 * Whiteboard to Markdown Converter
 * Uses Gemini 1.5 Flash Vision for diagram analysis
 * Trigger: callable function
 */
const whiteboardSchema: ResponseSchema = {
  description: "Whiteboard analysis result",
  type: SchemaType.OBJECT,
  properties: {
    markdown: {
      type: SchemaType.STRING,
      description: "Complete Markdown content with proper headings, lists, and structure",
    },
    detectedElements: {
      type: SchemaType.OBJECT,
      properties: {
        text: { type: SchemaType.STRING },
        diagrams: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              type: { type: SchemaType.STRING },
              description: { type: SchemaType.STRING },
            },
          },
        },
      },
    },
  },
  required: ["markdown", "detectedElements"],
};

export const convertWhiteboardToMarkdown = functions.https.onCall(async (request) => {
  const { imageRef, documentId } = request.data as { imageRef?: string; documentId?: string };

  if (!imageRef || !documentId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Image reference and document ID are required"
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
    // Download image
    let imagePath = imageRef;
    if (!imageRef.startsWith("gs://")) {
       const bucketName = process.env.STORAGE_BUCKET || "fisioflow-migration.appspot.com";
       imagePath = "gs://" + bucketName + "/" + imageRef;
    }
    const pathParts = imagePath.split("/");
    const bucketName = pathParts[2];
    const fileName = pathParts.slice(3).join("/");
    const [file] = await storageClient.bucket(bucketName).file(fileName).download();
    const base64Image = file.toString("base64");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: whiteboardSchema,
      },
    });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Image,
        },
      },
      { text: "Convert this whiteboard or handwritten notes image into structured Markdown format. Preserve text, diagram structures, and headings." },
    ]);

    const response = result.response;
    const conversion = JSON.parse(response.text());

    // Append to existing document content
    const docRef = await admin.firestore().collection("notes").doc(documentId).get();
    const existingContent = docRef.data()?.content || { type: "doc", content: [] };

    // Append the converted markdown as a new paragraph
    // Note: In a real app, you might want to parse Markdown to ProseMirror JSON
    const newContent = {
      type: "doc",
      content: [
        ...existingContent.content,
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: conversion.markdown || "Content could not be processed",
            }
          ],
        },
      ],
    };

    await admin.firestore().collection("notes").doc(documentId).update({
      content: newContent,
      plainText: (existingContent.plainText || "") + "\n" + (conversion.markdown || ""),
    });

    return {
      success: true,
      data: conversion,
    };
  } catch (error) {
    console.error("Error converting whiteboard:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to convert whiteboard"
    );
  }
});
