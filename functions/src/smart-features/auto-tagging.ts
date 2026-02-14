import * as functions from "firebase-functions/v2";
import { GoogleGenerativeAI, SchemaType, ResponseSchema } from "@google/generative-ai";

/**
 * Auto-tagging using Gemini 1.5 Flash
 * Trigger: callable function (manual trigger by user)
 * Analyzes note content and generates relevant tags
 */
const responseSchema: ResponseSchema = {
  description: "Analysis of note content",
  type: SchemaType.OBJECT,
  properties: {
    tags: {
      type: SchemaType.ARRAY,
      description: "3-5 relevant lowercase tags",
      items: { type: SchemaType.STRING },
    },
    summary: {
      type: SchemaType.STRING,
      description: "Brief summary max 200 chars",
    },
    category: {
      type: SchemaType.STRING,
      description: "One of: meeting, project, idea, personal, reference, code, design",
    },
    topics: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    keyPoints: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
  },
  required: ["tags", "summary", "category"],
};

export const autoTagDocument = functions.https.onCall(async (request) => {
  const { content } = request.data as { content?: string };

  if (!content || typeof content !== "string") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Content is required"
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
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const prompt = `Analyze the following note content and organize it. Note content: ${content.slice(0, 10000)}`;
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const aiData = JSON.parse(response.text());

    return {
      success: true,
      data: aiData,
    };
  } catch (error) {
    console.error("Error in auto-tagging with Gemini:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to generate tags with Gemini"
    );
  }
});
