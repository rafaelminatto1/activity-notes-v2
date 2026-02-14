import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";

/**
 * Voice Note Intelligence - Audio Transcription and Analysis
 * Uses GLM Audio API
 * Trigger: callable function
 */
export const transcribeAudioNote = functions.https.onCall(async (request) => {
  const data = request.data;
  const { audioRef, documentId } = data as any;

  if (!audioRef || !documentId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Audio reference and document ID are required"
    );
  }

  try {
    // Using GLM API for audio transcription
    const response = await fetch("https://api.z.ai/api/paas/v4/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: "glm-4.7-flash", // Supports audio natively
        messages: [
          {
            role: "system",
            content: "You are a voice note transcriber. Transcribe the audio and extract: 1) Full verbatim transcript, 2) A bulleted summary, 3) A list of action items/tasks, 4) Identified speakers if possible, 5) Key decisions made. Return a JSON object with this exact structure:\n{\n  \"transcript\": \"Full transcription text\",\n  \"summary\": \"3-5 bullet points summary\",\n  \"actionItems\": [\"action item 1\", \"action item 2\"],\n  \"speakers\": [\"Speaker 1\", \"Speaker 2\"],\n  \"decisions\": [\"decision 1\", \"decision 2\"],\n  \"duration\": \"estimated duration in MM:SS format\"\n}",
          },
          {
            role: "user",
            content: "Transcribe this audio file: " + audioRef,
          },
        ],
        temperature: 0.3,
      }),
    });

    const result = await response.json();
    const aiContent = result.choices?.[0]?.message?.content || "{}";

    let transcriptionData;
    try {
      transcriptionData = JSON.parse(aiContent);
    } catch {
      transcriptionData = {
        transcript: "Transcription failed",
        summary: "Unable to summarize",
        actionItems: [],
        speakers: [],
        decisions: [],
        duration: "0:00",
      };
    }

    // Update document with transcription data
    await admin.firestore().collection("notes").doc(documentId).update({
      aiAnalysis: {
        summary: transcriptionData.summary,
        actionItems: transcriptionData.actionItems,
        generatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
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
