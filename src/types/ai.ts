export type AIActionType =
  | "summarize"
  | "expand"
  | "improve"
  | "simplify"
  | "fixSpelling"
  | "changeTone"
  | "translate"
  | "continueWriting"
  | "generateFromPrompt"
  | "format"
  | "checkConsistency";

export interface AIRequest {
  action: AIActionType;
  text: string;
  instruction?: string;
  params?: {
    tone?: string;
    language?: string;
    prompt?: string;
  };
}

export interface AIResponse {
  result: string;
  tokensUsed: number;
}

export interface AIErrorResponse {
  error: string;
  retryAfter?: number;
}

export interface AIUsage {
  date: string; // YYYY-MM-DD in Pacific time
  count: number;
  lastRequestAt: number;
}
