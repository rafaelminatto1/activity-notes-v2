/**
 * Firebase GenKit Configuration - Simplificado
 * Configuração simplificada do GenKit para IA no backend
 */

import { genkit, z } from 'genkit';
import { googleAI, gemini15Flash } from '@genkit-ai/googleai';

// Inicializar GenKit com apenas o Google AI (sem Firebase plugin por enquanto)
export const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GEMINI_API_KEY })],
  model: gemini15Flash,
});

// Esquemas Zod simplificados para validação
export const schemas = {
  tagGeneration: z.object({
    tags: z.array(z.string()).min(1).max(10),
    category: z.string(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']),
  }),

  taskExtraction: z.object({
    tasks: z.array(z.object({
      title: z.string(),
      description: z.string().optional(),
      priority: z.enum(['low', 'medium', 'high', 'urgent']),
    })),
  }),

  structuredSummary: z.object({
    title: z.string(),
    summary: z.string(),
    keyPoints: z.array(z.string()).min(1),
    actionItems: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
  }),

  sentimentAnalysis: z.object({
    sentiment: z.enum(['positive', 'neutral', 'negative']),
    emotions: z.array(z.string()),
    topics: z.array(z.string()).optional(),
  }),

  improvementSuggestion: z.object({
    improvementSuggestion: z.string(),
    suggestions: z.array(z.string()).optional(),
  }),
};

// Prompts reutilizáveis
export const prompts = {
  tagGeneration: `Gere tags, categoria e prioridade para o texto abaixo. Retorne em formato JSON com: tags (array), category (string), priority (low/medium/high/urgent).

Texto: {{text}}`,
  taskExtraction: `Extraia tarefas do texto abaixo. Retorne em formato JSON com: tasks (array de objetos com title, description (opcional), priority (low/medium/high/urgent)).

Texto: {{text}}`,
  structuredSummary: `Gere um resumo estruturado do texto abaixo. Retorne em formato JSON com: title, summary, keyPoints (array), actionItems (array opcional), tags (array opcional).

Texto: {{text}}`,
  sentimentAnalysis: `Analise o sentimento e emoções do texto abaixo. Retorne em formato JSON com: sentiment (positive/neutral/negative), emotions (array), topics (array opcional).

Texto: {{text}}`,
  improvementSuggestion: `Sugira melhorias para o texto abaixo. Retorne em formato JSON com: improvementSuggestion (string), suggestions (array opcional).

Texto: {{text}}`,
  ragQuery: `Responda à pergunta usando o contexto abaixo. Se a resposta não estiver no contexto, diga que não sabe.

Contexto: {{context}}

Pergunta: {{question}}`,
  noteExpansion: `Expanda o texto abaixo adicionando mais detalhes e contexto.

Texto: {{text}}`,
  noteSimplification: `Simplifique o texto abaixo para torná-lo mais fácil de entender.

Texto: {{text}}`,
  continueWriting: `Continue escrevendo o texto abaixo de forma natural e coerente.

Texto: {{text}}`,
  translateNote: `Traduza o texto abaixo para {{language}}.

Texto: {{text}}`,
  changeTone: `Reescreva o texto abaixo mudando o tom para {{tone}}.

Texto: {{text}}`,
  generateFromPrompt: `Siga a instrução abaixo:

Instrução: {{instruction}}

Texto base: {{text}}`,
  extractEntities: `Extraia entidades do texto abaixo. Retorne em formato JSON com: people (array), organizations (array), locations (array), dates (array), numbers (array).

Texto: {{text}}`,
  categorizeNote: `Categorize o texto abaixo. Retorne em formato JSON com: category, subcategory, confidence (0-1), suggestedTags (array).

Texto: {{text}}`,
  searchQuery: `Gere uma query de busca primária, queries alternativas e palavras-chave para o texto abaixo. Retorne em formato JSON.

Texto: {{text}}`,
  summarizeNotes: `Resuma as notas abaixo. Retorne em formato JSON com: summary, themes (array), connections (array), recommendations (array).

Notas: {{notes}}`,
  chatWithContext: `Responda à pergunta usando o contexto.

Contexto: {{context}}

Pergunta: {{question}}`,
  proofread: `Corrija o texto abaixo e identifique erros. Retorne em formato JSON com: corrected, errors (array de objetos com original, correction, explanation), suggestions (array).

Texto: {{text}}`,
  extractCode: `Extraia blocos de código do texto abaixo. Retorne em formato JSON com: codeBlocks (array de objetos com language, code, lineNumbers (array)).

Texto: {{text}}`,
  formatNote: `Formate o texto abaixo com estrutura clara. Retorne em formato JSON com: formatted, structure (array de seções), suggestions (array).

Texto: {{text}}`,
};
