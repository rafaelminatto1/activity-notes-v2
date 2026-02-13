"use client";

import { useState, useCallback, useRef } from "react";
import type { Editor } from "@tiptap/core";
import type { AIActionType, AIResponse, AIErrorResponse } from "@/types/ai";
import { getAIUsage, incrementAIUsage, hasAIUsageRemaining } from "@/lib/ai/usage-tracker";
import { trackAIUsed } from "@/lib/firebase/analytics";
import { toast } from "sonner";

interface CallAIOptions {
  action: AIActionType;
  text: string;
  params?: Record<string, string>;
  instruction?: string;
}

async function getAuthToken(): Promise<string | null> {
  // Dynamic import to avoid importing firebase on server
  const { getAuth } = await import("firebase/auth");
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

async function callAI(options: CallAIOptions): Promise<AIResponse> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error("Faça login para usar a IA.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        action: options.action,
        text: options.text,
        params: options.params,
        instruction: options.instruction,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const data: AIErrorResponse = await res.json().catch(() => ({
        error: "Erro ao chamar IA.",
      }));

      if (res.status === 429 && data.retryAfter) {
        throw new Error(data.error || `Aguarde ${data.retryAfter}s antes de tentar novamente.`);
      }

      throw new Error(data.error || `Erro ${res.status} ao chamar IA.`);
    }

    const data: AIResponse = await res.json();
    return data;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("A requisição excedeu o tempo limite. Tente novamente.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function useEditorAI(editor: Editor | null) {
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState(() => getAIUsage());
  const abortRef = useRef(false);

  const refreshUsage = useCallback(() => {
    setUsage(getAIUsage());
  }, []);

  const getSelectedText = useCallback(() => {
    if (!editor) return "";
    const { from, to } = editor.state.selection;
    return editor.state.doc.textBetween(from, to, " ");
  }, [editor]);

  const getTextAbove = useCallback(() => {
    if (!editor) return "";
    const { from } = editor.state.selection;
    return editor.state.doc.textBetween(0, from, " ").slice(-3000);
  }, [editor]);

  const executeAction = useCallback(
    async (options: CallAIOptions): Promise<string> => {
      if (!hasAIUsageRemaining()) {
        toast.error("Limite diário de IA atingido (50 usos). Tente novamente amanhã.");
        throw new Error("Limite diário atingido.");
      }

      setLoading(true);
      abortRef.current = false;

      try {
        const response = await callAI(options);
        incrementAIUsage();
        refreshUsage();
        trackAIUsed(options.action);
        return response.result;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao chamar IA.";
        toast.error(message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [refreshUsage]
  );

  const improveSelection = useCallback(async () => {
    if (!editor) return;
    const text = getSelectedText();
    if (!text) {
      toast.error("Selecione um texto para melhorar.");
      return;
    }
    const result = await executeAction({ action: "improve", text });
    const { from, to } = editor.state.selection;
    editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, result).run();
  }, [editor, getSelectedText, executeAction]);

  const continueWriting = useCallback(async () => {
    if (!editor) return;
    const text = getTextAbove();
    if (!text) return;

    editor.chain().focus().setAIBlock({ action: "continueWriting" }).run();

    try {
      const result = await executeAction({ action: "continueWriting", text });
      updateAIBlock(editor, "done", result);
    } catch {
      updateAIBlock(editor, "error", "");
    }
  }, [editor, getTextAbove, executeAction]);

  const summarizeAbove = useCallback(async () => {
    if (!editor) return;
    const text = getTextAbove();
    if (!text) return;

    editor.chain().focus().setAIBlock({ action: "summarize" }).run();

    try {
      const result = await executeAction({ action: "summarize", text });
      updateAIBlock(editor, "done", result);
    } catch {
      updateAIBlock(editor, "error", "");
    }
  }, [editor, getTextAbove, executeAction]);

  const summarizeSelection = useCallback(async () => {
    if (!editor) return;
    const text = getSelectedText();
    if (!text) {
      toast.error("Selecione um texto para resumir.");
      return;
    }
    const result = await executeAction({ action: "summarize", text });
    const { from, to } = editor.state.selection;
    editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, result).run();
  }, [editor, getSelectedText, executeAction]);

  const expandSelection = useCallback(async () => {
    if (!editor) return;
    const text = getSelectedText();
    if (!text) {
      toast.error("Selecione um texto para expandir.");
      return;
    }
    const result = await executeAction({ action: "expand", text });
    const { from, to } = editor.state.selection;
    editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, result).run();
  }, [editor, getSelectedText, executeAction]);

  const simplifySelection = useCallback(async () => {
    if (!editor) return;
    const text = getSelectedText();
    if (!text) {
      toast.error("Selecione um texto para simplificar.");
      return;
    }
    const result = await executeAction({ action: "simplify", text });
    const { from, to } = editor.state.selection;
    editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, result).run();
  }, [editor, getSelectedText, executeAction]);

  const fixSpelling = useCallback(async () => {
    if (!editor) return;
    const text = getSelectedText();
    if (!text) {
      toast.error("Selecione um texto para corrigir.");
      return;
    }
    const result = await executeAction({ action: "fixSpelling", text });
    const { from, to } = editor.state.selection;
    editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, result).run();
  }, [editor, getSelectedText, executeAction]);

  const translateSelection = useCallback(
    async (language: string) => {
      if (!editor) return;
      const text = getSelectedText();
      if (!text) {
        toast.error("Selecione um texto para traduzir.");
        return;
      }
      const result = await executeAction({
        action: "translate",
        text,
        params: { language },
      });
      const { from, to } = editor.state.selection;
      editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, result).run();
    },
    [editor, getSelectedText, executeAction]
  );

  const changeTone = useCallback(
    async (tone: string) => {
      if (!editor) return;
      const text = getSelectedText();
      if (!text) {
        toast.error("Selecione um texto para alterar o tom.");
        return;
      }
      const result = await executeAction({
        action: "changeTone",
        text,
        params: { tone },
      });
      const { from, to } = editor.state.selection;
      editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, result).run();
    },
    [editor, getSelectedText, executeAction]
  );

  const freePrompt = useCallback(
    async (prompt: string) => {
      if (!editor) return;
      const text = getSelectedText() || getTextAbove();
      if (!text) return;

      editor.chain().focus().setAIBlock({ action: "generateFromPrompt" }).run();

      try {
        const result = await executeAction({
          action: "generateFromPrompt",
          text,
          params: { prompt },
        });
        updateAIBlock(editor, "done", result);
      } catch {
        updateAIBlock(editor, "error", "");
      }
    },
    [editor, getSelectedText, getTextAbove, executeAction]
  );

  const generateIdeas = useCallback(async () => {
    if (!editor) return;
    const text = getTextAbove();

    editor.chain().focus().setAIBlock({ action: "generateFromPrompt" }).run();

    try {
      const result = await executeAction({
        action: "generateFromPrompt",
        text: text || "documento vazio",
        params: {
          prompt:
            "Gere 5 ideias criativas para continuar este texto. Liste cada ideia em uma linha.",
        },
      });
      updateAIBlock(editor, "done", result);
    } catch {
      updateAIBlock(editor, "error", "");
    }
  }, [editor, getTextAbove, executeAction]);

  // Chat-style AI call (for AI panel)
  const chatWithAI = useCallback(
    async (message: string, documentContext: string): Promise<string> => {
      const result = await executeAction({
        action: "generateFromPrompt",
        text: documentContext,
        instruction: message,
      });
      return result;
    },
    [executeAction]
  );

  return {
    loading,
    usage,
    refreshUsage,
    improveSelection,
    continueWriting,
    summarizeAbove,
    summarizeSelection,
    expandSelection,
    simplifySelection,
    fixSpelling,
    translateSelection,
    changeTone,
    freePrompt,
    generateIdeas,
    chatWithAI,
  };
}

function updateAIBlock(editor: Editor, status: string, result: string) {
  const { doc } = editor.state;
  doc.descendants((node, pos) => {
    if (node.type.name === "aiBlock" && node.attrs.status === "loading") {
      editor
        .chain()
        .setNodeSelection(pos)
        .updateAttributes("aiBlock", { status, result })
        .run();
      return false;
    }
  });
}
