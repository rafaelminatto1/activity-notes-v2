import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  type GenerationConfig,
} from "@google/generative-ai";

const MODEL_NAME = "gemini-2.5-flash-lite";
const MAX_RETRIES = 2;
const BASE_DELAY_MS = 1500;
const REQUEST_TIMEOUT_MS = 15000;

let genAI: GoogleGenerativeAI | null = null;

function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY não está configurada.");
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

interface GenerateOptions {
  temperature?: number;
  maxOutputTokens?: number;
  systemInstruction?: string;
}

async function withRetryAndTimeout<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("TIMEOUT")), REQUEST_TIMEOUT_MS)
        ),
      ]);
      return result;
    } catch (error: unknown) {
      lastError = error;
      const message = (error as { message?: string }).message || "";
      const status = (error as { status?: number }).status;

      // Timeout — don't retry
      if (message === "TIMEOUT") {
        throw new Error("A requisição excedeu o tempo limite de 15 segundos.");
      }

      // Retry only for 429 (rate limit) and 503 (service unavailable)
      if (status === 429 || status === 503 || message.includes("429") || message.includes("503")) {
        if (attempt < MAX_RETRIES) {
          const delay = BASE_DELAY_MS * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }

      throw error;
    }
  }

  throw lastError;
}

export async function generateText(
  prompt: string,
  context?: string,
  options: GenerateOptions = {}
): Promise<{ text: string; tokensUsed: number }> {
  const ai = getGenAI();

  const generationConfig: GenerationConfig = {
    temperature: options.temperature ?? 0.7,
    maxOutputTokens: options.maxOutputTokens ?? 1000,
    topP: 0.95,
  };

  const model = ai.getGenerativeModel({
    model: MODEL_NAME,
    safetySettings,
    generationConfig,
    ...(options.systemInstruction
      ? { systemInstruction: options.systemInstruction }
      : {}),
  });

  const fullPrompt = context
    ? `${prompt}\n\n---\n\n${context}`
    : prompt;

  return withRetryAndTimeout(async () => {
    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const text = response.text();

    // Estimate tokens used (Gemini doesn't always return exact counts)
    const usage = response.usageMetadata;
    const tokensUsed = usage
      ? (usage.promptTokenCount ?? 0) + (usage.candidatesTokenCount ?? 0)
      : Math.ceil((fullPrompt.length + text.length) / 4); // rough estimate

    if (!text.trim()) {
      throw new Error("EMPTY_RESPONSE");
    }

    return { text, tokensUsed };
  });
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const ai = getGenAI();
  const model = ai.getGenerativeModel({ model: "text-embedding-004" });

  return withRetryAndTimeout(async () => {
    const result = await model.embedContent(text);
    return result.embedding.values;
  });
}

export async function generateChat(
  systemPrompt: string,
  userMessage: string,
  context?: string,
  options: GenerateOptions = {}
): Promise<{ text: string; tokensUsed: number }> {
  const fullMessage = context
    ? `Contexto do documento:\n${context}\n\n---\n\nPergunta do usuário: ${userMessage}`
    : userMessage;

  return generateText(fullMessage, undefined, {
    temperature: options.temperature ?? 0.7,
    maxOutputTokens: options.maxOutputTokens ?? 1000,
    systemInstruction: systemPrompt,
  });
}
