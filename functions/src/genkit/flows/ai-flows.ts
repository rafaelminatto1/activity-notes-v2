/**
 * Firebase GenKit Flows
 * Flows reutilizáveis para funcionalidades de IA no Activity Notes
 */

import { z } from 'genkit';
import { ai, prompts, schemas } from '../config';
import * as admin from 'firebase-admin';

const db = admin.firestore();

// ============================================================
// 1. Tag Generation Flow
// ============================================================

export const generateTagsFlow = ai.defineFlow({
  name: 'generateTagsFlow',
  inputSchema: z.object({
    text: z.string(),
    documentId: z.string().optional(),
  }),
  outputSchema: schemas.tagGeneration,
}, async ({ text, documentId }) => {
  const { output } = await ai.generate({
    prompt: prompts.tagGeneration.replace('{{text}}', text),
    output: { format: 'json', schema: schemas.tagGeneration },
  });

  // Salvar tags no documento se documentId fornecido
  if (documentId && output) {
    await db.collection('documents').doc(documentId).update({
      tags: output.tags,
      category: output.category,
      priority: output.priority,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  return output!;
});

// ============================================================
// 2. Task Extraction Flow
// ============================================================

export const extractTasksFlow = ai.defineFlow({
  name: 'extractTasksFlow',
  inputSchema: z.object({
    text: z.string(),
    documentId: z.string().optional(),
  }),
  outputSchema: schemas.taskExtraction,
}, async ({ text, documentId }) => {
  const { output } = await ai.generate({
    prompt: prompts.taskExtraction.replace('{{text}}', text),
    output: { format: 'json', schema: schemas.taskExtraction },
  });

  // Criar tarefas no Firestore se documentId fornecido
  if (documentId && output && output.tasks && output.tasks.length > 0) {
    const batch = db.batch();

    for (const task of output.tasks) {
      const taskRef = db.collection('tasks').doc();
      batch.set(taskRef, {
        ...task,
        documentId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();
  }

  return output!;
});

// ============================================================
// 3. Structured Summary Flow
// ============================================================

export const generateStructuredSummaryFlow = ai.defineFlow({
  name: 'generateStructuredSummaryFlow',
  inputSchema: z.object({
    text: z.string(),
    documentId: z.string().optional(),
  }),
  outputSchema: schemas.structuredSummary,
}, async ({ text, documentId }) => {
  const { output } = await ai.generate({
    prompt: prompts.structuredSummary.replace('{{text}}', text),
    output: { format: 'json', schema: schemas.structuredSummary },
  });

  // Salvar resumo no documento se documentId fornecido
  if (documentId && output) {
    await db.collection('documents').doc(documentId).update({
      summary: output.summary,
      keyPoints: output.keyPoints,
      actionItems: output.actionItems,
      tags: output.tags,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  return output!;
});

// ============================================================
// 4. Sentiment Analysis Flow
// ============================================================

export const analyzeSentimentFlow = ai.defineFlow({
  name: 'analyzeSentimentFlow',
  inputSchema: z.object({
    text: z.string(),
    documentId: z.string().optional(),
  }),
  outputSchema: schemas.sentimentAnalysis,
}, async ({ text, documentId }) => {
  const { output } = await ai.generate({
    prompt: prompts.sentimentAnalysis.replace('{{text}}', text),
    output: { format: 'json', schema: schemas.sentimentAnalysis },
  });

  // Salvar análise no documento se documentId fornecido
  if (documentId && output) {
    await db.collection('documents').doc(documentId).update({
      sentiment: output.sentiment,
      emotions: output.emotions,
      topics: output.topics,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  return output!;
});

// ============================================================
// 5. Improvement Suggestion Flow
// ============================================================

export const suggestImprovementsFlow = ai.defineFlow({
  name: 'suggestImprovementsFlow',
  inputSchema: z.object({
    text: z.string(),
    documentId: z.string().optional(),
  }),
  outputSchema: schemas.improvementSuggestion,
}, async ({ text }) => {
  const { output } = await ai.generate({
    prompt: prompts.improvementSuggestion.replace('{{text}}', text),
    output: { format: 'json', schema: schemas.improvementSuggestion },
  });

  return output!;
});

// ============================================================
// 6. RAG Query Flow
// ============================================================

export const ragQueryFlow = ai.defineFlow({
  name: 'ragQueryFlow',
  inputSchema: z.object({
    question: z.string(),
    userId: z.string(),
    maxResults: z.number().default(5),
  }),
  outputSchema: z.object({
    answer: z.string(),
    sources: z.array(z.object({
      documentId: z.string(),
      title: z.string(),
      content: z.string(),
      relevanceScore: z.number(),
    })),
  }),
}, async ({ question, userId, maxResults }) => {
  // 1. Gerar embedding usando ai.generate para obter o formato correto
  const { text: embeddingJson } = await ai.generate({
    prompt: `Converta a pergunta abaixo em um vetor de embedding numérico representando seu significado semântico. Retorne apenas um array JSON de números (ex: [0.1, -0.2, 0.3, ...]) com 768 dimensões.

Pergunta: ${question}`,
  });

  let embedding: number[] = [];
  try {
    embedding = JSON.parse(embeddingJson.trim());
  } catch (e) {
    // Fallback: gerar embedding simplificado usando hash
    embedding = new Array(768).fill(0);
    const hash = question.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] = ((hash * (i + 1)) % 100) / 100 - 0.5;
    }
  }

  const documentsSnapshot = await db
    .collection('documents')
    .where('userId', '==', userId)
    .where('vectorEmbedding', '!=', null)
    .limit(maxResults)
    .get();

  // Calcular similaridade (simplificado - em produção usar Firestore Vector Search)
  const documentsWithScores = documentsSnapshot.docs
    .map(doc => {
      const data = doc.data();
      const docEmbedding = data.vectorEmbedding as number[];

      // Cosine similarity
      let dotProduct = 0;
      let magnitudeA = 0;
      let magnitudeB = 0;

      for (let i = 0; i < Math.min(embedding.length, docEmbedding.length); i++) {
        dotProduct += embedding[i] * docEmbedding[i];
        magnitudeA += embedding[i] * embedding[i];
        magnitudeB += docEmbedding[i] * docEmbedding[i];
      }

      const similarity = dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));

      return {
        documentId: doc.id,
        title: data.title || 'Sem título',
        content: data.plainText || '',
        relevanceScore: similarity,
      };
    })
    .filter(doc => doc.relevanceScore > 0.7) // Limiar de relevância
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, maxResults);

  // 2. Construir contexto
  const context = documentsWithScores
    .map(doc => `Documento: ${doc.title}\n${doc.content}`)
    .join('\n\n---\n\n');

  // 3. Gerar resposta usando o contexto
  const { text } = await ai.generate({
    prompt: prompts.ragQuery
      .replace('{{context}}', context)
      .replace('{{question}}', question),
  });

  return {
    answer: text,
    sources: documentsWithScores,
  };
});

// ============================================================
// 7. Note Expansion Flow
// ============================================================

export const expandNoteFlow = ai.defineFlow({
  name: 'expandNoteFlow',
  inputSchema: z.object({
    text: z.string(),
    documentId: z.string().optional(),
  }),
  outputSchema: z.object({
    expanded: z.string(),
    addedSections: z.array(z.string()),
  }),
}, async ({ text }) => {
  const { text: expanded } = await ai.generate({
    prompt: prompts.noteExpansion.replace('{{text}}', text),
  });

  // Identificar seções adicionadas (simplificado)
  const addedSections = expanded.split('\n\n')
    .filter(section => section.length > 100)
    .slice(Math.ceil(text.split('\n\n').length / 2));

  return {
    expanded,
    addedSections,
  };
});

// ============================================================
// 8. Note Simplification Flow
// ============================================================

export const simplifyNoteFlow = ai.defineFlow({
  name: 'simplifyNoteFlow',
  inputSchema: z.object({
    text: z.string(),
  }),
  outputSchema: z.object({
    simplified: z.string(),
    readabilityScore: z.number(),
  }),
}, async ({ text }) => {
  const { text: simplified } = await ai.generate({
    prompt: prompts.noteSimplification.replace('{{text}}', text),
  });

  // Calcular score de legibilidade simplificado
  const avgWordLength = simplified.split(' ').reduce((sum, word) => sum + word.length, 0) / simplified.split(' ').length;
  const readabilityScore = Math.max(0, Math.min(100, 100 - (avgWordLength - 4) * 10));

  return {
    simplified,
    readabilityScore,
  };
});

// ============================================================
// 9. Continue Writing Flow
// ============================================================

export const continueWritingFlow = ai.defineFlow({
  name: 'continueWritingFlow',
  inputSchema: z.object({
    text: z.string(),
  }),
  outputSchema: z.object({
    continuation: z.string(),
    suggestedEndings: z.array(z.string()),
  }),
}, async ({ text }) => {
  const { text: continuation } = await ai.generate({
    prompt: prompts.continueWriting.replace('{{text}}', text),
  });

  // Sugerir possíveis finais
  const { text: endings } = await ai.generate({
    prompt: `Gere 3 possíveis finais para o texto abaixo, cada um com 1-2 frases.

Texto: ${text}`,
  });

  const suggestedEndings = endings.split('\n')
    .filter(line => line.trim().length > 10)
    .slice(0, 3);

  return {
    continuation,
    suggestedEndings,
  };
});

// ============================================================
// 10. Translate Flow
// ============================================================

export const translateNoteFlow = ai.defineFlow({
  name: 'translateNoteFlow',
  inputSchema: z.object({
    text: z.string(),
    language: z.string(),
  }),
  outputSchema: z.object({
    translated: z.string(),
    detectedLanguage: z.string(),
  }),
}, async ({ text, language }) => {
  const { text: translated } = await ai.generate({
    prompt: prompts.translateNote
      .replace('{{language}}', language)
      .replace('{{text}}', text),
  });

  // Detectar idioma de origem (simplificado)
  const detectedLanguage = text.split(' ')[0].length > 5 ? 'Português' : 'Inglês';

  return {
    translated,
    detectedLanguage,
  };
});

// ============================================================
// 11. Change Tone Flow
// ============================================================

export const changeToneFlow = ai.defineFlow({
  name: 'changeToneFlow',
  inputSchema: z.object({
    text: z.string(),
    tone: z.string(),
  }),
  outputSchema: z.object({
    rewritten: z.string(),
    toneAnalysis: z.object({
      original: z.string(),
      new: z.string(),
    }),
  }),
}, async ({ text, tone }) => {
  const { text: rewritten } = await ai.generate({
    prompt: prompts.changeTone
      .replace('{{tone}}', tone)
      .replace('{{text}}', text),
  });

  return {
    rewritten,
    toneAnalysis: {
      original: 'neutral',
      new: tone,
    },
  };
});

// ============================================================
// 12. Generate from Prompt Flow
// ============================================================

export const generateFromPromptFlow = ai.defineFlow({
  name: 'generateFromPromptFlow',
  inputSchema: z.object({
    text: z.string(),
    instruction: z.string(),
  }),
  outputSchema: z.object({
    generated: z.string(),
    tokensUsed: z.number(),
  }),
}, async ({ text, instruction }) => {
  const { text: generated, usage } = await ai.generate({
    prompt: prompts.generateFromPrompt
      .replace('{{instruction}}', instruction)
      .replace('{{text}}', text || '(sem texto base)'),
  });

  return {
    generated,
    tokensUsed: usage?.totalTokens || 0,
  };
});

// ============================================================
// 13. Extract Entities Flow
// ============================================================

export const extractEntitiesFlow = ai.defineFlow({
  name: 'extractEntitiesFlow',
  inputSchema: z.object({
    text: z.string(),
    documentId: z.string().optional(),
  }),
  outputSchema: z.object({
    people: z.array(z.string()),
    organizations: z.array(z.string()),
    locations: z.array(z.string()),
    dates: z.array(z.string()),
    numbers: z.array(z.number()),
  }),
}, async ({ text }) => {
  const { output } = await ai.generate({
    prompt: prompts.extractEntities.replace('{{text}}', text),
    output: { format: 'json' },
  });

  return output || {
    people: [],
    organizations: [],
    locations: [],
    dates: [],
    numbers: [],
  };
});

// ============================================================
// 14. Categorize Note Flow
// ============================================================

export const categorizeNoteFlow = ai.defineFlow({
  name: 'categorizeNoteFlow',
  inputSchema: z.object({
    text: z.string(),
    documentId: z.string().optional(),
  }),
  outputSchema: z.object({
    category: z.string(),
    subcategory: z.string(),
    confidence: z.number(),
    suggestedTags: z.array(z.string()),
  }),
}, async ({ text }) => {
  const { output } = await ai.generate({
    prompt: prompts.categorizeNote.replace('{{text}}', text),
    output: { format: 'json' },
  });

  return output || {
    category: 'other',
    subcategory: 'general',
    confidence: 0.5,
    suggestedTags: [],
  };
});

// ============================================================
// 15. Search Query Generation Flow
// ============================================================

export const generateSearchQueryFlow = ai.defineFlow({
  name: 'generateSearchQueryFlow',
  inputSchema: z.object({
    text: z.string(),
  }),
  outputSchema: z.object({
    primaryQuery: z.string(),
    alternativeQueries: z.array(z.string()),
    keywords: z.array(z.string()),
  }),
}, async ({ text }) => {
  const { output } = await ai.generate({
    prompt: prompts.searchQuery.replace('{{text}}', text),
    output: { format: 'json' },
  });

  return output || {
    primaryQuery: text,
    alternativeQueries: [],
    keywords: [],
  };
});

// ============================================================
// 16. Summarize Notes Flow
// ============================================================

export const summarizeNotesFlow = ai.defineFlow({
  name: 'summarizeNotesFlow',
  inputSchema: z.object({
    notes: z.array(z.object({
      title: z.string(),
      content: z.string(),
    })),
  }),
  outputSchema: z.object({
    summary: z.string(),
    themes: z.array(z.string()),
    connections: z.array(z.string()),
    recommendations: z.array(z.string()),
  }),
}, async ({ notes }) => {
  const notesText = notes.map(note => `## ${note.title}\n${note.content}`).join('\n\n');

  const { output } = await ai.generate({
    prompt: prompts.summarizeNotes.replace('{{notes}}', notesText),
    output: { format: 'json' },
  });

  return output || {
    summary: '',
    themes: [],
    connections: [],
    recommendations: [],
  };
});

// ============================================================
// 17. Chat with Context Flow
// ============================================================

export const chatWithContextFlow = ai.defineFlow({
  name: 'chatWithContextFlow',
  inputSchema: z.object({
    question: z.string(),
    context: z.string(),
    conversationHistory: z.array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })),
  }),
  outputSchema: z.object({
    answer: z.string(),
    suggestedFollowUp: z.array(z.string()),
  }),
}, async ({ question, context, conversationHistory }) => {
  const historyText = conversationHistory
    .map(msg => `${msg.role}: ${msg.content}`)
    .join('\n');

  const { text: answer } = await ai.generate({
    prompt: `${prompts.chatWithContext
      .replace('{{context}}', context)
      .replace('{{question}}', question)}

Histórico da conversa:
${historyText}`,
  });

  // Sugerir perguntas de acompanhamento
  const { text: suggestions } = await ai.generate({
    prompt: `Gere 3 perguntas de acompanhamento baseadas na resposta abaixo.
Retorne apenas as perguntas, uma por linha.

Resposta: ${answer}`,
  });

  const suggestedFollowUp = suggestions.split('\n')
    .filter(line => line.trim().length > 10)
    .slice(0, 3);

  return {
    answer,
    suggestedFollowUp,
  };
});

// ============================================================
// 18. Proofread Flow
// ============================================================

export const proofreadFlow = ai.defineFlow({
  name: 'proofreadFlow',
  inputSchema: z.object({
    text: z.string(),
  }),
  outputSchema: z.object({
    corrected: z.string(),
    errors: z.array(z.object({
      original: z.string(),
      correction: z.string(),
      explanation: z.string(),
    })),
    suggestions: z.array(z.string()),
  }),
}, async ({ text }) => {
  const { output } = await ai.generate({
    prompt: prompts.proofread.replace('{{text}}', text),
    output: { format: 'json' },
  });

  return output || {
    corrected: text,
    errors: [],
    suggestions: [],
  };
});

// ============================================================
// 19. Extract Code Flow
// ============================================================

export const extractCodeFlow = ai.defineFlow({
  name: 'extractCodeFlow',
  inputSchema: z.object({
    text: z.string(),
  }),
  outputSchema: z.object({
    codeBlocks: z.array(z.object({
      language: z.string(),
      code: z.string(),
      lineNumbers: z.array(z.number()),
    })),
  }),
}, async ({ text }) => {
  const { output } = await ai.generate({
    prompt: prompts.extractCode.replace('{{text}}', text),
    output: { format: 'json' },
  });

  return output || {
    codeBlocks: [],
  };
});

// ============================================================
// 20. Format Note Flow
// ============================================================

export const formatNoteFlow = ai.defineFlow({
  name: 'formatNoteFlow',
  inputSchema: z.object({
    text: z.string(),
  }),
  outputSchema: z.object({
    formatted: z.string(),
    structure: z.array(z.string()),
    suggestions: z.array(z.string()),
  }),
}, async ({ text }) => {
  const { output } = await ai.generate({
    prompt: prompts.formatNote.replace('{{text}}', text),
    output: { format: 'json' },
  });

  return output || {
    formatted: text,
    structure: [],
    suggestions: [],
  };
});
