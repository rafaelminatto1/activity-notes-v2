import * as functions from "firebase-functions/v2";
import { GoogleGenerativeAI, SchemaType, ResponseSchema } from "@google/generative-ai";

/**
 * PDF Document Analysis using Gemini 1.5 Flash
 * Trigger: callable function
 */
const responseSchema: ResponseSchema = {
  description: "Analysis of a PDF document",
  type: SchemaType.OBJECT,
  properties: {
    summary: {
      type: SchemaType.STRING,
      description: "Comprehensive summary in 3-5 paragraphs",
    },
    topics: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    entities: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          type: { type: SchemaType.STRING },
          value: { type: SchemaType.STRING },
        },
      },
    },
    actionItems: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          text: { type: SchemaType.STRING },
          due: { type: SchemaType.STRING },
        },
      },
    },
    questions: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    recommendedTags: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
  },
  required: ["summary", "topics", "entities", "actionItems", "questions", "recommendedTags"],
};

export const analyzePDFDocument = functions.https.onCall(async (request) => {
  const { documentRef } = request.data as { documentRef?: string };

  if (!documentRef || typeof documentRef !== "string") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Document reference is required"
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

    const prompt = `Analyze this document for key insights. If it's a URL or text content, process it directly: ${documentRef}`;
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const analysis = JSON.parse(response.text());

    return {
      success: true,
      data: analysis,
    };
  } catch (error) {
    console.error("Error analyzing document with Gemini:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to analyze document with Gemini"
    );
  }
});
