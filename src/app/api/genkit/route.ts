/**
 * Firebase GenKit API Route
 * API para acessar os flows do Firebase GenKit do backend
 */

import { NextRequest, NextResponse } from "next/server";
import { getFunctions, connectFunctionsEmulator, httpsCallable } from "firebase/functions";
import { initializeApp, getApps, getApp } from "firebase/app";

// Firebase Config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Connect to Firebase Functions
const functions = getFunctions(app);
if (process.env.FUNCTIONS_EMULATOR_HOST) {
  const [host, port] = process.env.FUNCTIONS_EMULATOR_HOST.split(":");
  connectFunctionsEmulator(functions, host, parseInt(port, 10));
}

// Helper to call Firebase GenKit functions
async function callGenKitFunction<T = any>(
  functionName: string,
  data: any
): Promise<{ success: boolean; data: T }> {
  const genkitFunction = httpsCallable(functions, functionName);
  const result = await genkitFunction(data);
  return result.data as { success: boolean; data: T };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    if (!action) {
      return NextResponse.json(
        { error: "Ação é obrigatória" },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case "generateTags":
        result = await callGenKitFunction("genkitGenerateTags", params);
        break;

      case "extractTasks":
        result = await callGenKitFunction("genkitExtractTasks", params);
        break;

      case "generateSummary":
        result = await callGenKitFunction("genkitGenerateSummary", params);
        break;

      case "analyzeSentiment":
        result = await callGenKitFunction("genkitAnalyzeSentiment", params);
        break;

      case "suggestImprovements":
        result = await callGenKitFunction("genkitSuggestImprovements", params);
        break;

      case "ragQuery":
        result = await callGenKitFunction("genkitRagQuery", params);
        break;

      case "expandNote":
        result = await callGenKitFunction("genkitExpandNote", params);
        break;

      case "simplifyNote":
        result = await callGenKitFunction("genkitSimplifyNote", params);
        break;

      case "continueWriting":
        result = await callGenKitFunction("genkitContinueWriting", params);
        break;

      case "translateNote":
        result = await callGenKitFunction("genkitTranslateNote", params);
        break;

      case "changeTone":
        result = await callGenKitFunction("genkitChangeTone", params);
        break;

      case "generateFromPrompt":
        result = await callGenKitFunction("genkitGenerateFromPrompt", params);
        break;

      case "extractEntities":
        result = await callGenKitFunction("genkitExtractEntities", params);
        break;

      case "categorizeNote":
        result = await callGenKitFunction("genkitCategorizeNote", params);
        break;

      case "generateSearchQuery":
        result = await callGenKitFunction("genkitGenerateSearchQuery", params);
        break;

      case "summarizeNotes":
        result = await callGenKitFunction("genkitSummarizeNotes", params);
        break;

      case "chatWithContext":
        result = await callGenKitFunction("genkitChatWithContext", params);
        break;

      case "proofread":
        result = await callGenKitFunction("genkitProofread", params);
        break;

      case "extractCode":
        result = await callGenKitFunction("genkitExtractCode", params);
        break;

      case "formatNote":
        result = await callGenKitFunction("genkitFormatNote", params);
        break;

      case "batchGenerateTags":
        result = await callGenKitFunction("genkitBatchGenerateTags", params);
        break;

      case "getUsageStats":
        result = await callGenKitFunction("genkitGetUsageStats", params);
        break;

      default:
        return NextResponse.json(
          { error: `Ação desconhecida: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro na API do GenKit:", error);

    const message = error instanceof Error ? error.message : "Erro desconhecido";

    return NextResponse.json(
      { error: message || "Falha ao processar requisição" },
      { status: 500 }
    );
  }
}
