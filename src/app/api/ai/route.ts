import { NextRequest, NextResponse } from "next/server";
import { generateText, generateChat } from "@/lib/gemini/client";
import { AI_PROMPTS } from "@/lib/ai/prompts";
import { getUserIdFromRequest } from "@/lib/auth/server-utils";
import type { AIActionType, AIRequest, AIResponse, AIErrorResponse } from "@/types/ai";

// --- Rate limiting per userId ---
// Per-minute: 10 req/min
// Per-day: 100 req/day

interface RateLimitEntry {
  minuteCount: number;
  minuteResetAt: number;
  dayCount: number;
  dayResetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT_MINUTE = 10;
const RATE_LIMIT_DAY = 100;
const MINUTE_MS = 60 * 1000;

function getPacificMidnight(): number {
  const now = new Date();
  const pacific = new Date(
    now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" })
  );
  pacific.setHours(24, 0, 0, 0);
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

  if (now >= entry.minuteResetAt) {
    entry.minuteCount = 0;
    entry.minuteResetAt = now + MINUTE_MS;
  }

  if (now >= entry.dayResetAt) {
    entry.dayCount = 0;
    entry.dayResetAt = getPacificMidnight();
  }

  if (entry.dayCount >= RATE_LIMIT_DAY) {
    const retryAfter = Math.ceil((entry.dayResetAt - now) / 1000);
    return { allowed: false, retryAfter, remaining: 0 };
  }

  if (entry.minuteCount >= RATE_LIMIT_MINUTE) {
    const retryAfter = Math.ceil((entry.minuteResetAt - now) / 1000);
    return { allowed: false, retryAfter, remaining: RATE_LIMIT_DAY - entry.dayCount };
  }

  entry.minuteCount++;
  entry.dayCount++;

  return { allowed: true, remaining: RATE_LIMIT_DAY - entry.dayCount };
}

// Cleanup stale entries
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now >= entry.dayResetAt && now >= entry.minuteResetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * MINUTE_MS);

// --- Prompt resolution ---

function getPromptForAction(
  action: AIActionType,
  params?: AIRequest["params"]
): { prompt: string; temperature: number } | null {
  const prompts = AI_PROMPTS.EDITOR;
  
  switch (action) {
    case "summarize":
      return { prompt: prompts.SUMMARIZE, temperature: 0.3 };
    case "expand":
      return { prompt: prompts.EXPAND, temperature: 0.7 };
    case "improve":
      return { prompt: "Melhore a escrita deste texto.", temperature: 0.4 }; // Generic improve
    case "simplify":
      return { prompt: prompts.SIMPLIFY, temperature: 0.4 };
    case "fixSpelling":
      return { prompt: prompts.FIX_GRAMMAR, temperature: 0.1 };
    case "continueWriting":
      return { prompt: prompts.CONTINUE, temperature: 0.7 };
    case "makeList":
      return { prompt: prompts.MAKE_LIST, temperature: 0.3 };
    case "changeTone":
      return params?.tone
        ? { prompt: prompts.CHANGE_TONE.replace("{tone}", params.tone), temperature: 0.5 }
        : null;
    case "translate":
      return params?.language
        ? { prompt: prompts.TRANSLATE.replace("{language}", params.language), temperature: 0.3 }
        : null;
    case "generateFromPrompt":
      return params?.prompt
        ? { prompt: params.prompt, temperature: 0.7 }
        : null;
    case "autoFillTask":
        return { prompt: AI_PROMPTS.TASKS.AUTO_FILL, temperature: 0.2 };
    case "generateDiagram":
        return { prompt: AI_PROMPTS.DIAGRAM, temperature: 0.1 };
    default:
      return null;
  }
}

// --- Handler ---

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Autenticação necessária." } satisfies AIErrorResponse,
        { status: 401 }
      );
    }

    const rateCheck = checkRateLimit(userId);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Limite de requisições excedido.", retryAfter: rateCheck.retryAfter } satisfies AIErrorResponse,
        { status: 429 }
      );
    }

    const body = (await request.json()) as AIRequest;
    const { action, text, instruction, params } = body;

    if (!action || !text) {
      return NextResponse.json(
        { error: "Action e text são obrigatórios." } satisfies AIErrorResponse,
        { status: 400 }
      );
    }

    const trimmedText = text.slice(0, 10000); // Increased limit

    // Handle chat separately if needed, otherwise use general flow
    if (action === "generateFromPrompt" && instruction) {
       // ... existing chat logic if needed, but simplified here
    }

    const promptConfig = getPromptForAction(action, params);
    if (!promptConfig) {
      return NextResponse.json(
        { error: "Ação inválida." } satisfies AIErrorResponse,
        { status: 400 }
      );
    }

    const { text: result, tokensUsed } = await generateText(
      promptConfig.prompt,
      trimmedText,
      { temperature: promptConfig.temperature }
    );

    // Clean up result for JSON responses (Task Auto-fill)
    let finalResult = result;
    if (action === "autoFillTask") {
      finalResult = result.replace(/```json/g, "").replace(/```/g, "").trim();
    }
    if (action === "generateDiagram") {
      finalResult = result.replace(/```mermaid/g, "").replace(/```/g, "").trim();
    }

    return NextResponse.json({
      result: finalResult,
      tokensUsed,
    } satisfies AIResponse);

  } catch (error) {
    console.error("AI API Error:", error);
    return NextResponse.json(
      { error: "Erro interno no serviço de IA." } satisfies AIErrorResponse,
      { status: 500 }
    );
  }
}
