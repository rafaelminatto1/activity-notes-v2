/**
 * Firebase AI Logic Hook
 * Hook React para usar o Firebase AI Logic diretamente no client-side
 *
 * Este hook permite chamar os modelos Gemini diretamente do navegador
 * com segurança integrada via Firebase App Check
 */

"use client";

import { useState, useCallback } from "react";
import { getAIClient, AILogicClient, type AIOptions, type AIModel } from "@/lib/firebase/ai-logic";

export type AIAction =
  | "summarize"
  | "expand"
  | "improve"
  | "simplify"
  | "fixSpelling"
  | "continueWriting"
  | "changeTone"
  | "translate"
  | "generateFromPrompt"
  | "extractTasks"
  | "generateTags"
  | "analyzeSentiment";

export interface UseAIClientReturn {
  client: AILogicClient;
  loading: boolean;
  error: string | null;
  generate: (prompt: string, options?: AIOptions) => Promise<string>;
  generateWithSystem: (systemPrompt: string, userMessage: string, options?: AIOptions) => Promise<string>;
  summarize: (text: string, options?: AIOptions) => Promise<string>;
  expand: (text: string, options?: AIOptions) => Promise<string>;
  improve: (text: string, options?: AIOptions) => Promise<string>;
  simplify: (text: string, options?: AIOptions) => Promise<string>;
  fixSpelling: (text: string, options?: AIOptions) => Promise<string>;
  continueWriting: (text: string, options?: AIOptions) => Promise<string>;
  changeTone: (text: string, tone: string, options?: AIOptions) => Promise<string>;
  translate: (text: string, language: string, options?: AIOptions) => Promise<string>;
  generateFromPrompt: (instruction: string, text?: string, options?: AIOptions) => Promise<string>;
  extractTasks: (text: string, options?: AIOptions) => Promise<string>;
  generateTags: (text: string, options?: AIOptions) => Promise<string>;
  analyzeSentiment: (text: string, options?: AIOptions) => Promise<string>;
  generateEmbedding: (text: string) => Promise<number[]>;
  chat: (messages: Array<{ role: string; content: string }>, options?: AIOptions) => Promise<string>;
  checkAvailability: () => Promise<boolean>;
}

export function useAIClient(): UseAIClientReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const client = getAIClient();

  const generate = useCallback(
    async (prompt: string, options?: AIOptions): Promise<string> => {
      setLoading(true);
      setError(null);

      try {
        const result = await client.generateText(prompt, options);
        return result.text;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao gerar texto";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client]
  );

  const generateWithSystem = useCallback(
    async (
      systemPrompt: string,
      userMessage: string,
      options?: AIOptions
    ): Promise<string> => {
      setLoading(true);
      setError(null);

      try {
        const result = await client.generateWithPrompt(
          systemPrompt,
          userMessage,
          undefined,
          options
        );
        return result.text;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao gerar texto";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client]
  );

  const summarize = useCallback(
    async (text: string, options?: AIOptions): Promise<string> => {
      setLoading(true);
      setError(null);

      try {
        const result = await client.summarize(text, options);
        return result.text;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao resumir texto";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client]
  );

  const expand = useCallback(
    async (text: string, options?: AIOptions): Promise<string> => {
      setLoading(true);
      setError(null);

      try {
        const result = await client.expand(text, options);
        return result.text;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao expandir texto";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client]
  );

  const improve = useCallback(
    async (text: string, options?: AIOptions): Promise<string> => {
      setLoading(true);
      setError(null);

      try {
        const result = await client.improve(text, options);
        return result.text;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao melhorar texto";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client]
  );

  const simplify = useCallback(
    async (text: string, options?: AIOptions): Promise<string> => {
      setLoading(true);
      setError(null);

      try {
        const result = await client.simplify(text, options);
        return result.text;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao simplificar texto";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client]
  );

  const fixSpelling = useCallback(
    async (text: string, options?: AIOptions): Promise<string> => {
      setLoading(true);
      setError(null);

      try {
        const result = await client.fixSpelling(text, options);
        return result.text;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao corrigir ortografia";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client]
  );

  const continueWriting = useCallback(
    async (text: string, options?: AIOptions): Promise<string> => {
      setLoading(true);
      setError(null);

      try {
        const result = await client.continueWriting(text, options);
        return result.text;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao continuar escrita";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client]
  );

  const changeTone = useCallback(
    async (
      text: string,
      tone: string,
      options?: AIOptions
    ): Promise<string> => {
      setLoading(true);
      setError(null);

      try {
        const result = await client.changeTone(text, tone, options);
        return result.text;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao alterar tom";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client]
  );

  const translate = useCallback(
    async (
      text: string,
      language: string,
      options?: AIOptions
    ): Promise<string> => {
      setLoading(true);
      setError(null);

      try {
        const result = await client.translate(text, language, options);
        return result.text;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao traduzir texto";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client]
  );

  const generateFromPrompt = useCallback(
    async (
      instruction: string,
      text?: string,
      options?: AIOptions
    ): Promise<string> => {
      setLoading(true);
      setError(null);

      try {
        const result = await client.generateFromPrompt(instruction, text, options);
        return result.text;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao gerar texto";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client]
  );

  const extractTasks = useCallback(
    async (text: string, options?: AIOptions): Promise<string> => {
      setLoading(true);
      setError(null);

      try {
        const result = await client.extractTasks(text, options);
        return result.text;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao extrair tarefas";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client]
  );

  const generateTags = useCallback(
    async (text: string, options?: AIOptions): Promise<string> => {
      setLoading(true);
      setError(null);

      try {
        const result = await client.generateTags(text, options);
        return result.text;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao gerar tags";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client]
  );

  const analyzeSentiment = useCallback(
    async (text: string, options?: AIOptions): Promise<string> => {
      setLoading(true);
      setError(null);

      try {
        const result = await client.analyzeSentiment(text, options);
        return result.text;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao analisar sentimento";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client]
  );

  const generateEmbedding = useCallback(
    async (text: string): Promise<number[]> => {
      setLoading(true);
      setError(null);

      try {
        const result = await client.generateEmbedding(text);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao gerar embedding";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client]
  );

  const chat = useCallback(
    async (
      messages: Array<{ role: string; content: string }>,
      options?: AIOptions
    ): Promise<string> => {
      setLoading(true);
      setError(null);

      try {
        const result = await client.chat(messages as any, options);
        return result.text;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro no chat";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client]
  );

  const checkAvailability = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const result = await client.checkAvailability();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao verificar disponibilidade";
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [client]);

  return {
    client,
    loading,
    error,
    generate,
    generateWithSystem,
    summarize,
    expand,
    improve,
    simplify,
    fixSpelling,
    continueWriting,
    changeTone,
    translate,
    generateFromPrompt,
    extractTasks,
    generateTags,
    analyzeSentiment,
    generateEmbedding,
    chat,
    checkAvailability,
  };
}

export default useAIClient;
