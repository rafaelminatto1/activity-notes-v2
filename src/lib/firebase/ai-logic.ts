/**
 * Firebase AI Logic Configuration
 * Configuração do Firebase AI Logic para uso client-side com Gemini
 *
 * Firebase AI Logic permite acesso direto aos modelos Gemini
 * a partir do cliente com segurança integrada via App Check
 */

import app from './config';
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  type GenerationConfig,
} from '@google/generative-ai';

// Tipos de modelos disponíveis
export type AIModel = 'gemini-2.5-flash-lite' | 'gemini-2.5-flash' | 'gemini-2.5-pro';

// Configurações de segurança
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// Configurações de geração padrão
const defaultGenerationConfig: GenerationConfig = {
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 1000,
};

/**
 * Interface para opções de IA
 */
export interface AIOptions {
  model?: AIModel;
  temperature?: number;
  maxOutputTokens?: number;
  systemInstruction?: string;
}

/**
 * Interface para resultado de geração
 */
export interface AIGenerationResult {
  text: string;
  tokensUsed: number;
  model: AIModel;
}

/**
 * Classe para gerenciar o Firebase AI Logic
 */
export class AILogicClient {
  private apiKey: string | null = null;
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || null;
    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    }
  }

  /**
   * Obtém uma instância do modelo generativo
   */
  private getModel(model: AIModel = 'gemini-2.5-flash-lite', options: AIOptions = {}) {
    if (!this.genAI) {
      throw new Error('GEMINI_API_KEY não está configurada');
    }

    const generationConfig: GenerationConfig = {
      ...defaultGenerationConfig,
      ...(options.temperature !== undefined && { temperature: options.temperature }),
      ...(options.maxOutputTokens !== undefined && {
        maxOutputTokens: options.maxOutputTokens,
      }),
    };

    return this.genAI.getGenerativeModel({
      model,
      safetySettings,
      generationConfig,
      ...(options.systemInstruction && {
        systemInstruction: options.systemInstruction,
      }),
    });
  }

  /**
   * Gera texto a partir de um prompt
   */
  async generateText(prompt: string, options: AIOptions = {}): Promise<AIGenerationResult> {
    const model = this.getModel(options.model, options);
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Estimar tokens usados
    const usage = response.usageMetadata;
    const tokensUsed = usage
      ? (usage.promptTokenCount ?? 0) + (usage.candidatesTokenCount ?? 0)
      : Math.ceil((prompt.length + text.length) / 4);

    if (!text.trim()) {
      throw new Error('EMPTY_RESPONSE');
    }

    return {
      text,
      tokensUsed,
      model: options.model || 'gemini-2.5-flash-lite',
    };
  }

  /**
   * Gera texto com contexto
   */
  async generateWithPrompt(
    systemPrompt: string,
    userMessage: string,
    context?: string,
    options: AIOptions = {}
  ): Promise<AIGenerationResult> {
    const fullMessage = context
      ? `Contexto do documento:\n${context}\n\n---\n\nPergunta do usuário: ${userMessage}`
      : userMessage;

    return this.generateText(fullMessage, {
      ...options,
      systemInstruction: systemPrompt,
    });
  }

  /**
   * Gera embeddings para busca semântica
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.genAI) {
      throw new Error('GEMINI_API_KEY não está configurada');
    }
    const model = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(text);
    return result.embedding.values;
  }

  /**
   * Gera uma lista de sugestões de conclusão
   */
  async generateSuggestions(
    text: string,
    count = 3
  ): Promise<string[]> {
    const model = this.getModel('gemini-2.5-flash-lite', {
      temperature: 0.9,
      maxOutputTokens: 200,
    });

    const prompt = `Gere ${count} sugestões de como continuar o texto abaixo.
Retorne apenas as sugestões, uma por linha.

Texto: ${text}`;

    const result = await model.generateContent(prompt);
    return result.response.text().split('\n').filter(s => s.trim().length > 0);
  }

  /**
   * Resume o texto
   */
  async summarize(
    text: string,
    options: AIOptions = {}
  ): Promise<AIGenerationResult> {
    const prompt = `Resuma o seguinte texto em 2-3 parágrafos concisos em português.
Mantenha os pontos-chave e a essência da mensagem.
Não adicione informações que não estejam no texto original.

Texto: ${text}`;

    return this.generateText(prompt, { ...options, temperature: 0.3 });
  }

  /**
   * Expande o texto
   */
  async expand(
    text: string,
    options: AIOptions = {}
  ): Promise<AIGenerationResult> {
    const prompt = `Continue e expanda o texto a seguir mantendo o tom e estilo do autor.
Adicione mais detalhes, exemplos e profundidade.
Responda no mesmo idioma do texto de entrada.
Escreva 2-3 parágrafos.

Texto: ${text}`;

    return this.generateText(prompt, { ...options, temperature: 0.7 });
  }

  /**
   * Melhora a escrita
   */
  async improve(
    text: string,
    options: AIOptions = {}
  ): Promise<AIGenerationResult> {
    const prompt = `Melhore a escrita do texto mantendo o significado original.
Corrija gramática, melhore a clareza, a coesão e a legibilidade.
Mantenha o mesmo tom e estilo.
Retorne apenas o texto melhorado, sem explicações.

Texto: ${text}`;

    return this.generateText(prompt, { ...options, temperature: 0.4 });
  }

  /**
   * Simplifica o texto
   */
  async simplify(
    text: string,
    options: AIOptions = {}
  ): Promise<AIGenerationResult> {
    const prompt = `Simplifique o texto a seguir para torná-lo mais fácil de entender.
Use palavras mais simples e frases mais curtas, mantendo as ideias principais.
Responda no mesmo idioma do texto de entrada.

Texto: ${text}`;

    return this.generateText(prompt, { ...options, temperature: 0.4 });
  }

  /**
   * Corrige ortografia
   */
  async fixSpelling(
    text: string,
    options: AIOptions = {}
  ): Promise<AIGenerationResult> {
    const prompt = `Corrija todos os erros de ortografia e gramática no texto a seguir.
Retorne apenas o texto corrigido, sem explicações.
Mantenha a formatação original.

Texto: ${text}`;

    return this.generateText(prompt, { ...options, temperature: 0.1 });
  }

  /**
   * Continua escrevendo
   */
  async continueWriting(
    text: string,
    options: AIOptions = {}
  ): Promise<AIGenerationResult> {
    const prompt = `Continue escrevendo naturalmente a partir de onde o texto termina.
Mantenha o estilo, o tom e o assunto.
Escreva 2-3 parágrafos.
Responda no mesmo idioma do texto de entrada.

Texto: ${text}`;

    return this.generateText(prompt, { ...options, temperature: 0.7 });
  }

  /**
   * Muda o tom do texto
   */
  async changeTone(
    text: string,
    tone: string,
    options: AIOptions = {}
  ): Promise<AIGenerationResult> {
    const prompt = `Reescreva o texto a seguir em um tom ${tone}.
Mantenha o significado original.
Retorne apenas o texto reescrito.
Responda no mesmo idioma do texto de entrada.

Texto: ${text}`;

    return this.generateText(prompt, { ...options, temperature: 0.5 });
  }

  /**
   * Traduz o texto
   */
  async translate(
    text: string,
    language: string,
    options: AIOptions = {}
  ): Promise<AIGenerationResult> {
    const prompt = `Traduza o texto a seguir para ${language}.
Mantenha a formatação original.
Retorne apenas a tradução, sem explicações.

Texto: ${text}`;

    return this.generateText(prompt, { ...options, temperature: 0.3 });
  }

  /**
   * Gera conteúdo a partir de um prompt
   */
  async generateFromPrompt(
    instruction: string,
    text?: string,
    options: AIOptions = {}
  ): Promise<AIGenerationResult> {
    const prompt = `Você é um assistente de escrita inteligente. Siga esta instrução do usuário:

${instruction}

${text ? `Texto base:\n${text}` : ''}

Responda no mesmo idioma da instrução acima. Seja conciso e direto.`;

    return this.generateText(prompt, { ...options, temperature: 0.7 });
  }

  /**
   * Extrai tarefas do texto
   */
  async extractTasks(text: string, options: AIOptions = {}): Promise<AIGenerationResult> {
    const prompt = `Analise o texto a seguir e extraia tarefas acionáveis.
Retorne APENAS um array JSON de strings, onde cada string é uma descrição de tarefa.
Se não encontrar tarefas, retorne um array vazio [].
Não inclua formatação markdown (json), apenas o array cru.

Texto: ${text}`;

    return this.generateText(prompt, { ...options, temperature: 0.3 });
  }

  /**
   * Gera tags para o texto
   */
  async generateTags(text: string, options: AIOptions = {}): Promise<AIGenerationResult> {
    const prompt = `Gere 3-5 tags relevantes para o texto abaixo.
Retorne apenas as tags separadas por vírgula, sem explicações.
Responda no mesmo idioma do texto.

Texto: ${text}`;

    return this.generateText(prompt, { ...options, temperature: 0.5 });
  }

  /**
   * Analisa o sentimento do texto
   */
  async analyzeSentiment(
    text: string,
    options: AIOptions = {}
  ): Promise<AIGenerationResult> {
    const prompt = `Analise o sentimento do texto abaixo.
Retorne um JSON com:
- sentiment: "positive", "neutral" ou "negative"
- confidence: nível de confiança (0-1)
- emotions: array de emoções detectadas
- topics: array de tópicos principais

Texto: ${text}`;

    return this.generateText(prompt, { ...options, temperature: 0.2 });
  }

  /**
   * Chat com histórico
   */
  async chat(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    options: AIOptions = {}
  ): Promise<AIGenerationResult> {
    const model = this.getModel(options.model, options);
    const history = messages.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }));
    const chat = model.startChat({ history });
    const result = await chat.sendMessage([{ text: messages[messages.length - 1].content }]);
    const response = result.response;
    const text = response.text();

    const usage = response.usageMetadata;
    const tokensUsed = usage
      ? (usage.promptTokenCount ?? 0) + (usage.candidatesTokenCount ?? 0)
      : Math.ceil(JSON.stringify(messages).length / 4 + text.length / 4);

    return {
      text,
      tokensUsed,
      model: options.model || 'gemini-2.5-flash-lite',
    };
  }

  /**
   * Verifica se a API está disponível
   */
  async checkAvailability(): Promise<boolean> {
    try {
      await this.generateText('Teste', { maxOutputTokens: 10 });
      return true;
    } catch (error) {
      console.error('Erro ao verificar disponibilidade da API:', error);
      return false;
    }
  }
}

// Instância singleton do cliente AI
let aiClient: AILogicClient | null = null;

/**
 * Obtém a instância do cliente AI Logic
 */
export function getAIClient(): AILogicClient {
  if (!aiClient) {
    aiClient = new AILogicClient();
  }
  return aiClient;
}

/**
 * Hook para usar AI Logic no React
 */
export function useAIClient() {
  const client = getAIClient();
  return client;
}

export default getAIClient;
