import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import * as storage from "@google-cloud/storage";

const storageClient = new storage.Storage();

export const analyzeImageWithOCR = functions.https.onCall(async (request) => {
  const data = request.data;
  const { imageRef } = data as any;

  if (!imageRef || typeof imageRef !== "string") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Image reference is required"
    );
  }

  try {
    let imagePath = imageRef;
    if (imageRef.startsWith("gs://")) {
      imagePath = imageRef;
    } else {
      const bucketName = process.env.STORAGE_BUCKET || "fisioflow-migration.appspot.com";
      imagePath = "gs://" + bucketName + "/" + imageRef;
    }

    const pathParts = imagePath.split("/");
    const bucketName = pathParts[2];
    const fileName = pathParts.slice(3).join("/");

    const [file] = await storageClient.bucket(bucketName).file(fileName).download();

    if (!file) {
      throw new Error("Failed to download image");
    }

    const buffer = Buffer.from(file);
    const base64Image = "data:image/jpeg;base64," + buffer.toString("base64");

    const response = await fetch("https://api.z.ai/api/paas/v4/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + process.env.GLM_API_KEY,
      },
      body: JSON.stringify({
        model: "glm-4.6v",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: imagePath,
              },
              {
                type: "text",
                text: "Extract all visible text from this image. Return JSON with textContent field.",
              },
            ],
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    const result = await response.json();
    const aiContent = result.choices?.[0]?.message?.content || "{}";

    let analysis;
    try {
      analysis = JSON.parse(aiContent);
    } catch {
      analysis = {
        textContent: "",
        confidence: "low",
      };
    }

    return {
      success: true,
      data: analysis,
    };
  } catch (error) {
    console.error("Error in vision OCR:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to analyze image"
    );
  }
});
