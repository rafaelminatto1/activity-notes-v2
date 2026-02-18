/**
 * Firebase GenKit Types
 * Tipos para usar com os flows do Firebase GenKit
 */

// ============================================================
// Tipos de Ação para GenKit
// ============================================================

export type GenKitAction =
  | "generateTags"
  | "extractTasks"
  | "generateSummary"
  | "analyzeSentiment"
  | "suggestImprovements"
  | "ragQuery"
  | "expandNote"
  | "simplifyNote"
  | "continueWriting"
  | "translateNote"
  | "changeTone"
  | "generateFromPrompt"
  | "extractEntities"
  | "categorizeNote"
  | "generateSearchQuery"
  | "summarizeNotes"
  | "chatWithContext"
  | "proofread"
  | "extractCode"
  | "formatNote"
  | "batchGenerateTags"
  | "getUsageStats";

// ============================================================
// Tipos de Modelo
// ============================================================

export type AIModel =
  | "gemini-2.5-flash-lite"
  | "gemini-2.5-flash"
  | "gemini-2.5-pro";

// ============================================================
// Tipos de Prioridade
// ============================================================

export type Priority = "low" | "medium" | "high" | "urgent";

// ============================================================
// Tipos de Sentimento
// ============================================================

export type Sentiment = "positive" | "neutral" | "negative";

// ============================================================
// Tipos de Categoria
// ============================================================

export type Category =
  | "work"
  | "personal"
  | "ideas"
  | "meeting"
  | "learning"
  | "finance"
  | "health"
  | "travel"
  | "recipes"
  | "other";

// ============================================================
// Requests
// ============================================================

export interface GenerateTagsRequest {
  text: string;
  documentId?: string;
}

export interface ExtractTasksRequest {
  text: string;
  documentId?: string;
}

export interface GenerateSummaryRequest {
  text: string;
  documentId?: string;
}

export interface AnalyzeSentimentRequest {
  text: string;
  documentId?: string;
}

export interface SuggestImprovementsRequest {
  text: string;
  documentId?: string;
}

export interface RagQueryRequest {
  question: string;
  maxResults?: number;
}

export interface ExpandNoteRequest {
  text: string;
}

export interface SimplifyNoteRequest {
  text: string;
}

export interface ContinueWritingRequest {
  text: string;
}

export interface TranslateNoteRequest {
  text: string;
  language: string;
}

export interface ChangeToneRequest {
  text: string;
  tone: string;
}

export interface GenerateFromPromptRequest {
  text?: string;
  instruction: string;
}

export interface ExtractEntitiesRequest {
  text: string;
  documentId?: string;
}

export interface CategorizeNoteRequest {
  text: string;
  documentId?: string;
}

export interface GenerateSearchQueryRequest {
  text: string;
}

export interface SummarizeNotesRequest {
  notes: Array<{
    title: string;
    content: string;
  }>;
}

export interface ChatWithContextRequest {
  question: string;
  context: string;
  conversationHistory?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

export interface ProofreadRequest {
  text: string;
}

export interface ExtractCodeRequest {
  text: string;
}

export interface FormatNoteRequest {
  text: string;
}

export interface BatchGenerateTagsRequest {
  documents: Array<{
    id: string;
    text: string;
  }>;
}

// ============================================================
// Responses
// ============================================================

export interface GenerateTagsResponse {
  tags: string[];
  category: string;
  priority: Priority;
}

export interface ExtractTasksResponse {
  tasks: Array<{
    title: string;
    description?: string;
    dueDate?: string;
    priority: Priority;
    completed: boolean;
  }>;
}

export interface GenerateStructuredSummaryResponse {
  title: string;
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  tags: string[];
}

export interface AnalyzeSentimentResponse {
  sentiment: Sentiment;
  confidence: number;
  emotions: string[];
  topics: string[];
}

export interface SuggestImprovementsResponse {
  original: string;
  improved: string;
  changes: string[];
  explanation: string;
}

export interface RagQueryResponse {
  answer: string;
  sources: Array<{
    documentId: string;
    title: string;
    content: string;
    relevanceScore: number;
  }>;
}

export interface ExpandNoteResponse {
  expanded: string;
  addedSections: string[];
}

export interface SimplifyNoteResponse {
  simplified: string;
  readabilityScore: number;
}

export interface ContinueWritingResponse {
  continuation: string;
  suggestedEndings: string[];
}

export interface TranslateNoteResponse {
  translated: string;
  detectedLanguage: string;
}

export interface ChangeToneResponse {
  rewritten: string;
  toneAnalysis: {
    original: string;
    new: string;
  };
}

export interface GenerateFromPromptResponse {
  generated: string;
  tokensUsed: number;
}

export interface ExtractEntitiesResponse {
  people: string[];
  organizations: string[];
  locations: string[];
  dates: string[];
  numbers: number[];
}

export interface CategorizeNoteResponse {
  category: Category;
  subcategory: string;
  confidence: number;
  suggestedTags: string[];
}

export interface GenerateSearchQueryResponse {
  primaryQuery: string;
  alternativeQueries: string[];
  keywords: string[];
}

export interface SummarizeNotesResponse {
  summary: string;
  themes: string[];
  connections: string[];
  recommendations: string[];
}

export interface ChatWithContextResponse {
  answer: string;
  suggestedFollowUp: string[];
}

export interface ProofreadResponse {
  corrected: string;
  errors: Array<{
    original: string;
    correction: string;
    explanation: string;
  }>;
  suggestions: string[];
}

export interface ExtractCodeResponse {
  codeBlocks: Array<{
    language: string;
    code: string;
    lineNumbers: number[];
  }>;
}

export interface FormatNoteResponse {
  formatted: string;
  structure: string[];
  suggestions: string[];
}

export interface UsageStatsResponse {
  today: {
    count: number;
    limit: number;
    remaining: number;
    lastAction?: string;
    lastUsedAt?: unknown;
  };
  month: {
    count: number;
    limit: number;
    remaining: number;
  };
}

// ============================================================
// GenKit API Response Wrapper
// ============================================================

export interface GenKitResponse<T = unknown> {
  success: boolean;
  data: T;
}

export interface GenKitError {
  success: false;
  error: string;
}

// ============================================================
// Hook Types
// ============================================================

export interface UseGenKitReturn<T = unknown> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (params: Record<string, unknown>) => Promise<T>;
}
