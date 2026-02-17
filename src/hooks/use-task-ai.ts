"use client";

import { useState } from "react";
import { toast } from "sonner";
import { incrementAIUsage, hasAIUsageRemaining } from "@/lib/ai/usage-tracker";

export function useTaskAI() {
  const [loading, setLoading] = useState(false);

  const autoFillTask = async (title: string, description: string) => {
    if (!title) {
      toast.error("Adicione um título para usar a IA.");
      return null;
    }

    if (!hasAIUsageRemaining()) {
      toast.error("Limite diário de IA atingido.");
      return null;
    }

    setLoading(true);
    const toastId = toast.loading("Analisando tarefa...");

    try {
      const { getAuth } = await import("firebase/auth");
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();

      if (!token) throw new Error("Não autenticado");

      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "autoFillTask",
          text: `Título: ${title}
Descrição: ${description}`,
        }),
      });

      if (!response.ok) throw new Error("Erro na IA");

      const data = await response.json();
      const result = JSON.parse(data.result);
      
      incrementAIUsage();
      toast.success("Sugestões geradas!", { id: toastId });
      return result;
    } catch (error) {
      console.error(error);
      toast.error("Falha ao gerar sugestões.", { id: toastId });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { autoFillTask, loading };
}
