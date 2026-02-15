/**
 * Firebase GenKit Cloud Functions
 * Exports GenKit flows as Cloud Functions
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import {
  generateTagsFlow,
  extractTasksFlow,
  generateStructuredSummaryFlow,
  analyzeSentimentFlow,
  suggestImprovementsFlow,
  ragQueryFlow,
  expandNoteFlow,
  simplifyNoteFlow,
  continueWritingFlow,
  translateNoteFlow,
  changeToneFlow,
  generateFromPromptFlow,
  extractEntitiesFlow,
  categorizeNoteFlow,
  generateSearchQueryFlow,
  summarizeNotesFlow,
  chatWithContextFlow,
  proofreadFlow,
  extractCodeFlow,
  formatNoteFlow,
} from './flows/ai-flows';
import {
  checkRateLimit,
  recordSuccessfulRequest,
  activateCooldown,
  RateLimitError,
} from './rate-limit';

const db = admin.firestore();

// ============================================================
// Rate Limiting Wrapper
// ============================================================

interface RateLimitedFunction {
  (data: any): Promise<any>;
}

/**
 * Wrapper para funções GenKit com rate limiting
 */
async function withRateLimit(
  userId: string,
  tokensEstimate: number,
  fn: RateLimitedFunction
): Promise<any> {
  // 1. Verificar rate limit
  const rateCheck = await checkRateLimit(userId);

  if (!rateCheck.allowed) {
    return {
      success: false,
      error: rateCheck.error,
      retryAfter: rateCheck.retryAfter,
      remaining: rateCheck.remaining,
    };
  }

  try {
    // 2. Executar função
    const result = await fn({
      text: '',
      tokensUsed: tokensEstimate,
    });

    // 3. Registrar requisição bem-sucedida
    await recordSuccessfulRequest(userId, tokensEstimate);

    return result;
  } catch (error: any) {
    // 4. Verificar se é erro de rate limit da API
    if (
      error?.message?.includes('429') ||
      error?.message?.includes('RATE_LIMIT_EXCEEDED') ||
      error?.message?.includes('quota')
    ) {
      await activateCooldown(userId, 'api_rate_limit', 60);
      return {
        success: false,
        error: RateLimitError.MINUTE_LIMIT_EXCEEDED,
        retryAfter: 60,
      };
    }

    throw error;
  }
}

// ============================================================
// 1. Generate Tags
// ============================================================

export const genkitGenerateTags = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Autenticação necessária.');
  }

  const { text, documentId } = request.data;

  if (!text) {
    throw new HttpsError('invalid-argument', 'Texto é obrigatório.');
  }

  try {
    // Estimar tokens: ~50 tokens para geração de tags
    return await withRateLimit(request.auth.uid, 50, async ({ text, tokensUsed }) => {
      const result = await generateTagsFlow({ text, documentId });
      return { success: true, data: result };
    });
  } catch (error) {
    console.error('Erro ao gerar tags:', error);
    throw new HttpsError('internal', 'Falha ao gerar tags.');
  }
});

// ============================================================
// 2. Extract Tasks
// ============================================================

export const genkitExtractTasks = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Autenticação necessária.');
  }

  const { text, documentId } = request.data;

  if (!text) {
    throw new HttpsError('invalid-argument', 'Texto é obrigatório.');
  }

  try {
    const result = await extractTasksFlow({ text, documentId });
    return { success: true, data: result };
  } catch (error) {
    console.error('Erro ao extrair tarefas:', error);
    throw new HttpsError('internal', 'Falha ao extrair tarefas.');
  }
});

// ============================================================
// 3. Generate Structured Summary
// ============================================================

export const genkitGenerateSummary = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Autenticação necessária.');
  }

  const { text, documentId } = request.data;

  if (!text) {
    throw new HttpsError('invalid-argument', 'Texto é obrigatório.');
  }

  try {
    const result = await generateStructuredSummaryFlow({ text, documentId });
    return { success: true, data: result };
  } catch (error) {
    console.error('Erro ao gerar resumo:', error);
    throw new HttpsError('internal', 'Falha ao gerar resumo.');
  }
});

// ============================================================
// 4. Analyze Sentiment
// ============================================================

export const genkitAnalyzeSentiment = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Autenticação necessária.');
  }

  const { text, documentId } = request.data;

  if (!text) {
    throw new HttpsError('invalid-argument', 'Texto é obrigatório.');
  }

  try {
    const result = await analyzeSentimentFlow({ text, documentId });
    return { success: true, data: result };
  } catch (error) {
    console.error('Erro ao analisar sentimento:', error);
    throw new HttpsError('internal', 'Falha ao analisar sentimento.');
  }
});

// ============================================================
// 5. Suggest Improvements
// ============================================================

export const genkitSuggestImprovements = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Autenticação necessária.');
  }

  const { text, documentId } = request.data;

  if (!text) {
    throw new HttpsError('invalid-argument', 'Texto é obrigatório.');
  }

  try {
    const result = await suggestImprovementsFlow({ text, documentId });
    return { success: true, data: result };
  } catch (error) {
    console.error('Erro ao sugerir melhorias:', error);
    throw new HttpsError('internal', 'Falha ao sugerir melhorias.');
  }
});

// ============================================================
// 6. RAG Query (Chat with Notes)
// ============================================================

export const genkitRagQuery = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Autenticação necessária.');
  }

  const { question, maxResults = 5 } = request.data;

  if (!question) {
    throw new HttpsError('invalid-argument', 'Pergunta é obrigatória.');
  }

  try {
    const result = await ragQueryFlow({
      question,
      userId: request.auth.uid,
      maxResults,
    });
    return { success: true, data: result };
  } catch (error) {
    console.error('Erro no RAG query:', error);
    throw new HttpsError('internal', 'Falha ao buscar nas notas.');
  }
});

// ============================================================
// 7. Expand Note
// ============================================================

export const genkitExpandNote = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Autenticação necessária.');
  }

  const { text } = request.data;

  if (!text) {
    throw new HttpsError('invalid-argument', 'Texto é obrigatório.');
  }

  try {
    const result = await expandNoteFlow({ text });
    return { success: true, data: result };
  } catch (error) {
    console.error('Erro ao expandir nota:', error);
    throw new HttpsError('internal', 'Falha ao expandir nota.');
  }
});

// ============================================================
// 8. Simplify Note
// ============================================================

export const genkitSimplifyNote = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Autenticação necessária.');
  }

  const { text } = request.data;

  if (!text) {
    throw new HttpsError('invalid-argument', 'Texto é obrigatório.');
  }

  try {
    const result = await simplifyNoteFlow({ text });
    return { success: true, data: result };
  } catch (error) {
    console.error('Erro ao simplificar nota:', error);
    throw new HttpsError('internal', 'Falha ao simplificar nota.');
  }
});

// ============================================================
// 9. Continue Writing
// ============================================================

export const genkitContinueWriting = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Autenticação necessária.');
  }

  const { text } = request.data;

  if (!text) {
    throw new HttpsError('invalid-argument', 'Texto é obrigatório.');
  }

  try {
    const result = await continueWritingFlow({ text });
    return { success: true, data: result };
  } catch (error) {
    console.error('Erro ao continuar escrita:', error);
    throw new HttpsError('internal', 'Falha ao continuar escrita.');
  }
});

// ============================================================
// 10. Translate Note
// ============================================================

export const genkitTranslateNote = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Autenticação necessária.');
  }

  const { text, language } = request.data;

  if (!text || !language) {
    throw new HttpsError('invalid-argument', 'Texto e idioma são obrigatórios.');
  }

  try {
    const result = await translateNoteFlow({ text, language });
    return { success: true, data: result };
  } catch (error) {
    console.error('Erro ao traduzir nota:', error);
    throw new HttpsError('internal', 'Falha ao traduzir nota.');
  }
});

// ============================================================
// 11. Change Tone
// ============================================================

export const genkitChangeTone = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Autenticação necessária.');
  }

  const { text, tone } = request.data;

  if (!text || !tone) {
    throw new HttpsError('invalid-argument', 'Texto e tom são obrigatórios.');
  }

  try {
    const result = await changeToneFlow({ text, tone });
    return { success: true, data: result };
  } catch (error) {
    console.error('Erro ao mudar tom:', error);
    throw new HttpsError('internal', 'Falha ao mudar tom.');
  }
});

// ============================================================
// 12. Generate from Prompt
// ============================================================

export const genkitGenerateFromPrompt = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Autenticação necessária.');
  }

  const { text, instruction } = request.data;

  if (!instruction) {
    throw new HttpsError('invalid-argument', 'Instrução é obrigatória.');
  }

  try {
    const result = await generateFromPromptFlow({ text, instruction });
    return { success: true, data: result };
  } catch (error) {
    console.error('Erro ao gerar a partir do prompt:', error);
    throw new HttpsError('internal', 'Falha ao gerar conteúdo.');
  }
});

// ============================================================
// 13. Extract Entities
// ============================================================

export const genkitExtractEntities = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Autenticação necessária.');
  }

  const { text, documentId } = request.data;

  if (!text) {
    throw new HttpsError('invalid-argument', 'Texto é obrigatório.');
  }

  try {
    const result = await extractEntitiesFlow({ text, documentId });
    return { success: true, data: result };
  } catch (error) {
    console.error('Erro ao extrair entidades:', error);
    throw new HttpsError('internal', 'Falha ao extrair entidades.');
  }
});

// ============================================================
// 14. Categorize Note
// ============================================================

export const genkitCategorizeNote = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Autenticação necessária.');
  }

  const { text, documentId } = request.data;

  if (!text) {
    throw new HttpsError('invalid-argument', 'Texto é obrigatório.');
  }

  try {
    const result = await categorizeNoteFlow({ text, documentId });
    return { success: true, data: result };
  } catch (error) {
    console.error('Erro ao categorizar nota:', error);
    throw new HttpsError('internal', 'Falha ao categorizar nota.');
  }
});

// ============================================================
// 15. Generate Search Query
// ============================================================

export const genkitGenerateSearchQuery = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Autenticação necessária.');
  }

  const { text } = request.data;

  if (!text) {
    throw new HttpsError('invalid-argument', 'Texto é obrigatório.');
  }

  try {
    const result = await generateSearchQueryFlow({ text });
    return { success: true, data: result };
  } catch (error) {
    console.error('Erro ao gerar query de busca:', error);
    throw new HttpsError('internal', 'Falha ao gerar query de busca.');
  }
});

// ============================================================
// 16. Summarize Notes (Multiple)
// ============================================================

export const genkitSummarizeNotes = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Autenticação necessária.');
  }

  const { notes } = request.data;

  if (!notes || !Array.isArray(notes)) {
    throw new HttpsError('invalid-argument', 'Notas são obrigatórias.');
  }

  try {
    const result = await summarizeNotesFlow({ notes });
    return { success: true, data: result };
  } catch (error) {
    console.error('Erro ao resumir notas:', error);
    throw new HttpsError('internal', 'Falha ao resumir notas.');
  }
});

// ============================================================
// 17. Chat with Context
// ============================================================

export const genkitChatWithContext = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Autenticação necessária.');
  }

  const { question, context, conversationHistory } = request.data;

  if (!question || !context) {
    throw new HttpsError('invalid-argument', 'Pergunta e contexto são obrigatórios.');
  }

  try {
    const result = await chatWithContextFlow({
      question,
      context,
      conversationHistory: conversationHistory || [],
    });
    return { success: true, data: result };
  } catch (error) {
    console.error('Erro no chat com contexto:', error);
    throw new HttpsError('internal', 'Falha no chat com contexto.');
  }
});

// ============================================================
// 18. Proofread
// ============================================================

export const genkitProofread = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Autenticação necessária.');
  }

  const { text } = request.data;

  if (!text) {
    throw new HttpsError('invalid-argument', 'Texto é obrigatório.');
  }

  try {
    const result = await proofreadFlow({ text });
    return { success: true, data: result };
  } catch (error) {
    console.error('Erro ao revisar texto:', error);
    throw new HttpsError('internal', 'Falha ao revisar texto.');
  }
});

// ============================================================
// 19. Extract Code
// ============================================================

export const genkitExtractCode = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Autenticação necessária.');
  }

  const { text } = request.data;

  if (!text) {
    throw new HttpsError('invalid-argument', 'Texto é obrigatório.');
  }

  try {
    const result = await extractCodeFlow({ text });
    return { success: true, data: result };
  } catch (error) {
    console.error('Erro ao extrair código:', error);
    throw new HttpsError('internal', 'Falha ao extrair código.');
  }
});

// ============================================================
// 20. Format Note
// ============================================================

export const genkitFormatNote = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Autenticação necessária.');
  }

  const { text } = request.data;

  if (!text) {
    throw new HttpsError('invalid-argument', 'Texto é obrigatório.');
  }

  try {
    const result = await formatNoteFlow({ text });
    return { success: true, data: result };
  } catch (error) {
    console.error('Erro ao formatar nota:', error);
    throw new HttpsError('internal', 'Falha ao formatar nota.');
  }
});

// ============================================================
// Batch Operations (Process multiple documents at once)
// ============================================================

export const genkitBatchGenerateTags = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Autenticação necessária.');
  }

  const { documents } = request.data;

  if (!documents || !Array.isArray(documents)) {
    throw new HttpsError('invalid-argument', 'Documentos são obrigatórios.');
  }

  try {
    const results = await Promise.all(
      documents.map((doc: any) =>
        generateTagsFlow({ text: doc.text, documentId: doc.id })
      )
    );

    return { success: true, data: results };
  } catch (error) {
    console.error('Erro em batch de tags:', error);
    throw new HttpsError('internal', 'Falha no processamento em lote.');
  }
});

// ============================================================
// Get AI Usage Stats
// ============================================================

export const genkitGetUsageStats = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Autenticação necessária.');
  }

  try {
    const uid = request.auth.uid;
    const today = new Date().toISOString().slice(0, 10);

    // Get today's usage
    const usageRef = db.collection('users').doc(uid).collection('aiUsage').doc(today);
    const usageSnap = await usageRef.get();
    const usageData = usageSnap.exists ? usageSnap.data() : null;

    // Get month's usage
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const monthUsageSnap = await db
      .collection('users')
      .doc(uid)
      .collection('aiUsage')
      .where('date', '>=', monthStart.toISOString().slice(0, 10))
      .get();

    const totalMonthUsage = monthUsageSnap.docs.reduce(
      (sum, doc) => sum + (doc.data()?.count || 0),
      0
    );

    return {
      success: true,
      data: {
        today: {
          count: usageData?.count || 0,
          limit: 50,
          remaining: 50 - (usageData?.count || 0),
          lastAction: usageData?.lastAction,
          lastUsedAt: usageData?.lastUsedAt,
        },
        month: {
          count: totalMonthUsage,
          limit: 1000,
          remaining: 1000 - totalMonthUsage,
        },
      },
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas de uso:', error);
    throw new HttpsError('internal', 'Falha ao obter estatísticas.');
  }
});
