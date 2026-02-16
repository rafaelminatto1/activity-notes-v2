"use client";

import { useState, useCallback } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/config";
import { toast } from "sonner";

export interface Source {
  documentId: string;
  title: string;
  content: string;
  relevanceScore: number;
}

export interface QAResponse {
  answer: string;
  sources: Source[];
}

export function useGlobalQA() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string; sources?: Source[] }[]>([]);

  const openQA = useCallback(() => setIsOpen(true), []);
  const closeQA = useCallback(() => setIsOpen(false), []);

  const askQuestion = useCallback(async (question: string) => {
    if (!question.trim()) return;

    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setIsLoading(true);

    try {
      if (!functions) throw new Error("Firebase functions not initialized");
      const ragQuery = httpsCallable<{ question: string }, { success: boolean; data: QAResponse }>(
        functions,
        "genkitRagQuery"
      );

      const result = await ragQuery({ question });
      
      if (result.data.success) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: result.data.data.answer,
            sources: result.data.data.sources,
          },
        ]);
      } else {
        throw new Error("Falha na resposta da IA.");
      }
    } catch (error) {
      console.error("Q&A Error:", error);
      toast.error("Erro ao processar sua pergunta.");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Desculpe, não consegui encontrar uma resposta no momento." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearHistory = useCallback(() => setMessages([]), []);

  return {
    isOpen,
    openQA,
    closeQA,
    isLoading,
    messages,
    askQuestion,
    clearHistory,
  };
}
