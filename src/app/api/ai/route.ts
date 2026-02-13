import { NextRequest, NextResponse } from "next/server";
import { generateText, generateChat } from "@/lib/gemini/client";
import { AI_PROMPTS, SYSTEM_PROMPT } from "@/lib/gemini/prompts";
import type { AIActionType, AIRequest, AIResponse, AIErrorResponse } from "@/types/ai";

// --- Rate limiting per userId ---
// Per-minute: 5 req/min
// Per-day: 50 req/day (resets at midnight Pacific)

interface RateLimitEntry {
  minuteCount: number;
  minuteResetAt: number;
  dayCount: number;
  dayResetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT_MINUTE = 5;
const RATE_LIMIT_DAY = 50;
const MINUTE_MS = 60 * 1000;

function getPacificMidnight(): number {
  const now = new Date();
  // Get current time in Pacific
  const pacific = new Date(
    now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" })
  );
  // Set to next midnight
  pacific.setHours(24, 0, 0, 0);
  // Convert back to UTC timestamp
  const offset = now.getTime() - pacific.getTime();
  return now.getTime() - offset + 24 * 60 * 60 * 1000;
}

function checkRateLimit(userId: string): { allowed: boolean; retryAfter?: number; remaining: number } {
  const now = Date.now();
  let entry = rateLimitMap.get(userId);

  if (!entry) {
    entry = {
      minuteCount: 0,
      minuteResetAt: now + MINUTE_MS,
      dayCount: 0,
      dayResetAt: getPacificMidnight(),
    };
    rateLimitMap.set(userId, entry);
  }

  // Reset minute window
  if (now >= entry.minuteResetAt) {
    entry.minuteCount = 0;
    entry.minuteResetAt = now + MINUTE_MS;
  }

  // Reset day window
  if (now >= entry.dayResetAt) {
    entry.dayCount = 0;
    entry.dayResetAt = getPacificMidnight();
  }

  // Check daily limit
  if (entry.dayCount >= RATE_LIMIT_DAY) {
    const retryAfter = Math.ceil((entry.dayResetAt - now) / 1000);
    return { allowed: false, retryAfter, remaining: 0 };
  }

  // Check per-minute limit
  if (entry.minuteCount >= RATE_LIMIT_MINUTE) {
    const retryAfter = Math.ceil((entry.minuteResetAt - now) / 1000);
    return { allowed: false, retryAfter, remaining: RATE_LIMIT_DAY - entry.dayCount };
  }

  entry.minuteCount++;
  entry.dayCount++;

  return { allowed: true, remaining: RATE_LIMIT_DAY - entry.dayCount };
}

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now >= entry.dayResetAt && now >= entry.minuteResetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * MINUTE_MS);

// --- Auth helpers ---

function decodeFirebaseToken(token: string): { uid: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf-8")
    );

    // Validate basic claims
    const now = Math.floor(Date.now() / 1000);
    if (!payload.user_id || !payload.exp) return null;
    if (payload.exp < now) return null;
    if (payload.iss && !payload.iss.startsWith("https://securetoken.google.com/")) return null;

    return { uid: payload.user_id };
  } catch {
    return null;
  }
}

function getUserIdFromRequest(request: NextRequest): string | null {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;

  const token = auth.slice(7);
  const decoded = decodeFirebaseToken(token);
  return decoded?.uid ?? null;
}

// --- Prompt resolution ---

function getPromptForAction(
  action: AIActionType,
  params?: AIRequest["params"]
): { prompt: string; temperature: number } | null {
  switch (action) {
    case "summarize":
      return { prompt: AI_PROMPTS.summarize, temperature: 0.3 };
    case "expand":
      return { prompt: AI_PROMPTS.expand, temperature: 0.7 };
    case "improve":
      return { prompt: AI_PROMPTS.improve, temperature: 0.4 };
    case "simplify":
      return { prompt: AI_PROMPTS.simplify, temperature: 0.4 };
    case "fixSpelling":
      return { prompt: AI_PROMPTS.fixSpelling, temperature: 0.1 };
    case "continueWriting":
      return { prompt: AI_PROMPTS.continueWriting, temperature: 0.7 };
    case "changeTone":
      return params?.tone
        ? { prompt: AI_PROMPTS.changeTone(params.tone), temperature: 0.5 }
        : null;
    case "translate":
      return params?.language
        ? { prompt: AI_PROMPTS.translate(params.language), temperature: 0.3 }
        : null;
    case "generateFromPrompt":
      return params?.prompt
        ? { prompt: AI_PROMPTS.generateFromPrompt(params.prompt), temperature: 0.7 }
        : null;
    default:
      return null;
  }
}

// --- Handler ---

export async function POST(request: NextRequest) {
  try {
    // 1. Validate auth
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Autenticação necessária. Faça login novamente." } satisfies AIErrorResponse,
        { status: 401 }
      );
    }

    // 2. Rate limiting by userId
    const rateCheck = checkRateLimit(userId);
    if (!rateCheck.allowed) {
      const isDaily = rateCheck.remaining === 0;
      const message = isDaily
        ? "Você atingiu o limite diário de 50 usos de IA. O limite será renovado à meia-noite (Pacific)."
        : `Muitas requisições. Aguarde ${rateCheck.retryAfter} segundos.`;

      return NextResponse.json(
        { error: message, retryAfter: rateCheck.retryAfter } satisfies AIErrorResponse,
        {
          status: 429,
          headers: { "Retry-After": String(rateCheck.retryAfter) },
        }
      );
    }

    // 3. Parse and validate request body
    const body = (await request.json()) as AIRequest;
    const { action, text, instruction, params } = body;

    if (!action || !text) {
      return NextResponse.json(
        { error: "Campos 'action' e 'text' são obrigatórios." } satisfies AIErrorResponse,
        { status: 400 }
      );
    }

    // Limit text input size to prevent abuse
    const trimmedText = text.slice(0, 5000);

    // 4. Handle chat action separately (for AI panel)
    if (action === "generateFromPrompt" && instruction) {
      const { text: result, tokensUsed } = await generateChat(
        SYSTEM_PROMPT,
        instruction,
        trimmedText,
        { temperature: 0.7, maxOutputTokens: 1000 }
      );

      return NextResponse.json({
        result,
        tokensUsed,
      } satisfies AIResponse);
    }

    // 5. Resolve prompt for action
    const promptConfig = getPromptForAction(action, params);
    if (!promptConfig) {
      return NextResponse.json(
        { error: "Ação inválida ou parâmetros ausentes." } satisfies AIErrorResponse,
        { status: 400 }
      );
    }

    // 6. Generate
    const { text: result, tokensUsed } = await generateText(
      promptConfig.prompt,
      trimmedText,
      { temperature: promptConfig.temperature, maxOutputTokens: 1000 }
    );

    return NextResponse.json({
      result,
      tokensUsed,
    } satisfies AIResponse);
  } catch (error) {
    console.error("Erro na API de IA:", error);

    const message = error instanceof Error ? error.message : "";

    // Timeout
    if (message.includes("tempo limite") || message === "TIMEOUT") {
      return NextResponse.json(
        { error: "A IA demorou demais para responder. Tente novamente." } satisfies AIErrorResponse,
        { status: 504 }
      );
    }

    // Empty response — suggest retry
    if (message === "EMPTY_RESPONSE") {
      return NextResponse.json(
        { error: "A IA retornou uma resposta vazia. Tente novamente." } satisfies AIErrorResponse,
        { status: 502 }
      );
    }

    // Gemini rate limit
    if (message.includes("429")) {
      return NextResponse.json(
        { error: "Limite da API Gemini excedido. Tente novamente em alguns segundos.", retryAfter: 10 } satisfies AIErrorResponse,
        { status: 429, headers: { "Retry-After": "10" } }
      );
    }

    // Gemini unavailable
    if (message.includes("503") || message.includes("unavailable")) {
      return NextResponse.json(
        { error: "Serviço de IA temporariamente indisponível. Tente novamente em breve." } satisfies AIErrorResponse,
        { status: 503 }
      );
    }

    // API key not configured
    if (message.includes("GEMINI_API_KEY")) {
      return NextResponse.json(
        { error: "Serviço de IA não configurado." } satisfies AIErrorResponse,
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Falha ao gerar resposta da IA. Tente novamente." } satisfies AIErrorResponse,
      { status: 500 }
    );
  }
}
