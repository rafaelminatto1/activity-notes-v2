import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";

/**
 * PDF Document Analysis using GLM
 * Trigger: callable function
 */
export const analyzePDFDocument = functions.https.onCall(async (request) => {
  const data = request.data;
  const { documentRef } = data as any;

  if (!documentRef || typeof documentRef !== "string") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Document reference is required"
    );
  }

  try {
    // Using GLM PDF Analysis capability
    const response = await fetch("https://api.z.ai/api/paas/v4/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: "glm-4.7-flash",
        messages: [
          {
            role: "system",
            content: "You are a document analyzer. Analyze the following document and extract: 1) A comprehensive summary, 2) Key topics and themes, 3) Important entities (people, dates, amounts), 4) Action items, 5) Questions raised, 6) Recommended tags. Return a JSON object with this exact structure:{\n  \"summary\": \"Comprehensive summary in 3-5 paragraphs\",\n  \"topics\": [\"topic1\", \"topic2\"],\n  \"entities\": [{\"type\": \"person\", \"value\": \"name\"}, {\"type\": \"date\", \"value\": \"date\"}],\n  \"actionItems\": [{\"text\": \"action\", \"due\": \"optional date\"}],\n  \"questions\": [\"question1\", \"question2\"],\n  \"recommendedTags\": [\"tag1\", \"tag2\"]\n}",
          },
          {
            role: "user",
            content: "Analyze this PDF document for key insights: " + documentRef,
          },
        ],
        temperature: 0.4,
        max_tokens: 4000,
      }),
    });
    const result = await response.json();
    const aiContent = result.choices?.[0]?.message?.content || "{}";

    let analysis;
    try {
      analysis = JSON.parse(aiContent);
    } catch {
      analysis = {
        summary: "Analysis failed",
        topics: [],
        entities: [],
        actionItems: [],
        questions: [],
        recommendedTags: [],
      };
    }

    return {
      success: true,
      data: analysis,
    };
  } catch (error) {
    console.error("Error analyzing PDF:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to analyze document"
    );
  }
});
