import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";

/**
 * Whiteboard to Markdown Converter
 * Uses GLM-4.6V Vision for diagram analysis
 * Trigger: callable function
 */
export const convertWhiteboardToMarkdown = functions.https.onCall(async (request) => {
  const data = request.data;
  const { imageRef, documentId } = data as any;

  if (!imageRef || !documentId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Image reference and document ID are required"
    );
  }

  try {
    // Using GLM Vision for diagram understanding
    const response = await fetch("https://api.z.ai/api/paas/v4/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: "glm-4.6v",
        messages: [
          {
            role: "system",
            content: "You are a whiteboard analyzer. Analyze this image and convert it to structured Markdown. Preserve: 1) All text content, 2) Diagram structure (lists, arrows, boxes), 3) Headings and sections. Return a JSON object with this exact structure:\n{\n  \"markdown\": \"Complete Markdown content with proper headings, lists, and structure\",\n  \"detectedElements\": {\n    \"text\": \"All text content\",\n    \"diagrams\": [{\"type\": \"flowchart|mindmap|list\", \"description\": \"description\"}]\n  }\n}",
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: imageRef,
              },
              {
                type: "text",
                text: "Convert this whiteboard or handwritten notes image into structured Markdown format for a note-taking app.",
              },
            ],
          },
        ],
        temperature: 0.3,
      }),
    });

    const result = await response.json();
    const aiContent = result.choices?.[0]?.message?.content || "{}";

    let conversion;
    try {
      conversion = JSON.parse(aiContent);
    } catch {
      conversion = {
        markdown: "# Whiteboard Content\n\n[Image analysis failed]",
        detectedElements: {
          text: "",
          diagrams: [],
        },
      };
    }

    // Append to existing document content
    const docRef = await admin.firestore().collection("notes").doc(documentId).get();
    const existingContent = docRef.data()?.content || { type: "doc", content: [] };

    // Append the converted markdown as a new paragraph
    const newContent = {
      type: "doc",
      content: [
        ...existingContent.content,
        {
          type: "paragraph",
          content: conversion.markdown || "# Whiteboard Notes\n\nContent could not be processed",
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
