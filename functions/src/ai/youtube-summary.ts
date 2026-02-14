import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";

/**
 * YouTube Summary using GLM API
 * Trigger: callable function (manual trigger by user)
 */
export const summarizeYoutubeVideo = functions.https.onCall(async (request) => {
  const data = request.data;
  const { url } = data as any;

  if (!url || typeof url !== "string") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "YouTube URL is required"
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

    // Generate summary using GLM API
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
            content: "You are a YouTube video summarizer. Summarize following video title and content in a structured way. Return a JSON object with this exact structure:\n{\n  \"title\": \"Brief engaging title\",\n  \"summary\": \"3-5 bullet points of key takeaways\",\n  \"keyTopics\": [\"topic1\", \"topic2\", \"topic3\"],\n  \"timestampedPoints\": [{\"timestamp\": \"MM:SS\", \"point\": \"point text\"}],\n  \"actionItems\": [\"action item 1\", \"action item 2\"]\n}",
          },
          {
            role: "user",
            content: "Summarize this YouTube video:\n\nTitle: " + videoTitle + "\n\nURL: " + url,
          },
        ],
        temperature: 0.5,
        response_format: { type: "json_object" },
      }),
    });

    const result = await response.json();
    const aiContent = result.choices?.[0]?.message?.content || "{}";

    let summary;
    try {
      summary = JSON.parse(aiContent);
    } catch {
      summary = {
        title: "Summary: " + videoTitle,
        summary: "Unable to generate summary",
        keyTopics: [],
        timestampedPoints: [],
        actionItems: [],
      };
    }

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
