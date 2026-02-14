import * as functions from "firebase-functions/v2";
import { GoogleGenerativeAI, SchemaType, ResponseSchema } from "@google/generative-ai";

/**
 * YouTube Summary using Gemini 1.5 Flash
 * Trigger: callable function (manual trigger by user)
 */
const summarySchema: ResponseSchema = {
  description: "YouTube video summary",
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING },
    summary: { type: SchemaType.STRING },
    keyTopics: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    timestampedPoints: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          timestamp: { type: SchemaType.STRING },
          point: { type: SchemaType.STRING },
        },
      },
    },
    actionItems: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
  },
  required: ["title", "summary", "keyTopics"],
};

export const summarizeYoutubeVideo = functions.https.onCall(async (request) => {
  const { url } = request.data as { url?: string };

  if (!url || typeof url !== "string") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "YouTube URL is required"
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
    // Extract video ID from URL
    const youtubeRegex = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)?([^&\s]+)/;
    const videoIdMatch = url.match(youtubeRegex);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;

    if (!videoId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid YouTube URL"
      );
    }

    // Get video info using YouTube oEmbed API (free)
    const oembedResponse = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
    const oembedData = await oembedResponse.json();
    const videoTitle = oembedData.title || "Untitled Video";

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: summarySchema,
      },
    });

    // Note: Standard Gemini API does not fetch URL content. 
    // This prompt relies on the model's training data or the title.
    // For better results, one should fetch transcripts.
    const prompt = `Summarize this YouTube video based on its title and context. 
    Title: ${videoTitle}
    URL: ${url}
    
    Provide a structured summary with key topics and action items.`;
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const summary = JSON.parse(response.text());

    // Return the summary
    return {
      success: true,
      data: summary,
      videoId,
      videoTitle: oembedData.title,
      thumbnail: oembedData.thumbnail_url,
    };
  } catch (error) {
    console.error("Error summarizing YouTube video:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to summarize video"
    );
  }
});
