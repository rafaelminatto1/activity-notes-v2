import * as functions from "firebase-functions/v2";
import * as storage from "@google-cloud/storage";
import { GoogleGenerativeAI, SchemaType, ResponseSchema } from "@google/generative-ai";

const storageClient = new storage.Storage();

const ocrSchema: ResponseSchema = {
  description: "OCR extraction result",
  type: SchemaType.OBJECT,
  properties: {
    textContent: {
      type: SchemaType.STRING,
      description: "All visible text extracted from the image",
    },
    confidence: {
      type: SchemaType.STRING,
      description: "Confidence level: high, medium, or low",
    },
  },
  required: ["textContent"],
};

export const analyzeImageWithOCR = functions.https.onCall(async (request) => {
  const { imageRef } = request.data as { imageRef?: string };

  if (!imageRef || typeof imageRef !== "string") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Image reference is required"
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

    const base64Image = file.toString("base64");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: ocrSchema,
      },
    });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "image/jpeg", // Assuming JPEG for now, could detect from filename
          data: base64Image,
        },
      },
      { text: "Extract all visible text from this image." },
    ]);

    const response = result.response;
    const analysis = JSON.parse(response.text());

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
