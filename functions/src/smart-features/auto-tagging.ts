import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { z } from "zod";

/**
 * Auto-tagging using GLM AI
 * Trigger: callable function (manual trigger by user)
 * Analyzes note content and generates relevant tags
 */
const schema = z.object({
  tags: z.array(z.string()),
  summary: z.string(),
  category: z.string().optional(),
  topics: z.array(z.string()).optional(),
  keyPoints: z.array(z.string()).optional(),
});

type AIAnalysisResult = z.infer<typeof schema>;

export const autoTagDocument = functions.https.onCall(async (request) => {
  const data = request.data;
  const { content } = data as any;

  if (!content || typeof content !== "string") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Content is required"
    );
  }

  try {
    const response = await fetch("https://api.z.ai/api/paas/v4/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + process.env.GLM_API_KEY,
      },
      body: JSON.stringify({
        model: "glm-4.7-flash",
        messages: [
          {
            role: "system",
            content: "You are an intelligent note organizer. Analyze the following note content and generate:\n1. 3-5 relevant tags (max 20 chars each)\n2. A brief summary (max 200 chars)\n3. Category (one of: meeting, project, idea, personal, reference, code, design)\n\nTags should be lowercase, comma-separated (no spaces after commas). Focus on meaningful topics, not generic terms.\n\nReturn ONLY a JSON object with this exact structure:\n{\n  \"tags\": [\"tag1\", \"tag2\", \"tag3\"],\n  \"summary\": \"Brief summary here\",\n  \"category\": \"category_name\",\n  \"topics\": [\"topic1\", \"topic2\"],\n  \"keyPoints\": [\"point1\", \"point2\"]\n}",
          },
          {
            role: "user",
            content: content.slice(0, 3000),
          },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    const result = await response.json();
    const aiContent = result.choices?.[0]?.message?.content || "{}";

    let aiData: AIAnalysisResult;
    try {
      aiData = JSON.parse(aiContent);
    } catch {
      // Fallback: create simple analysis
      const words = content.split(/\s+/);
      const topics = words.filter(w =>
        ["project", "task", "meeting", "idea", "code", "design", "reference", "work"].includes(w.toLowerCase())
      ).slice(0, 5);

      aiData = {
        tags: topics.map(t => t.toLowerCase()),
        summary: content.slice(0, 200),
        category: topics[0] || "personal",
        topics: topics,
        keyPoints: [],
      };
    }

    return {
      success: true,
      data: aiData,
    };
  } catch (error) {
    console.error("Error in auto-tagging:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to generate tags"
    );
  }
});
