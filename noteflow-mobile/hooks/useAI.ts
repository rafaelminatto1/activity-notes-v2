import { useCallback } from 'react';
import { useAIStore } from '@/stores/ai-store';
import { generateAIResponse, getAIUsage, canUseAI } from '@/lib/gemini/client';
import { AI_PROMPTS } from '@/lib/gemini/prompts';
import { AIAction } from '@/types/ai';

export function useAI() {
  const store = useAIStore();

  const refreshUsage = useCallback(async () => {
    const usage = await getAIUsage();
    store.setUsage({ ...usage, limit: 50 });
  }, [store]);

  const sendMessage = useCallback(
    async (action: AIAction, content: string, customPrompt?: string) => {
      const allowed = await canUseAI();
      if (!allowed) {
        store.addMessage('assistant', 'Limite diário de IA atingido (50/50). Tente novamente amanhã.');
        return;
      }

      const userMessage = customPrompt || AI_PROMPTS[action](content);
      store.addMessage('user', customPrompt || `[${action}] ${content.substring(0, 100)}...`, action);
      store.setLoading(true);

      try {
        const prompt = AI_PROMPTS[action](content);
        const response = await generateAIResponse(
          action === 'freePrompt' ? content : prompt,
          action !== 'freePrompt' ? content : undefined
        );
        store.addMessage('assistant', response, action);
        await refreshUsage();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao gerar resposta.';
        store.addMessage('assistant', message);
      } finally {
        store.setLoading(false);
      }
    },
    [store, refreshUsage]
  );

  return {
    ...store,
    sendMessage,
    refreshUsage,
  };
}
