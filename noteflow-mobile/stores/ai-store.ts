import { create } from 'zustand';
import { AIMessage, AIUsage } from '@/types/ai';
import { v4 as uuidv4 } from 'uuid';

interface AIState {
  messages: AIMessage[];
  isLoading: boolean;
  usage: AIUsage;
  addMessage: (role: 'user' | 'assistant', content: string, action?: AIMessage['action']) => void;
  setLoading: (loading: boolean) => void;
  setUsage: (usage: AIUsage) => void;
  clearMessages: () => void;
}

export const useAIStore = create<AIState>((set) => ({
  messages: [],
  isLoading: false,
  usage: { count: 0, date: new Date().toISOString().split('T')[0], limit: 50 },

  addMessage: (role, content, action) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: uuidv4(),
          role,
          content,
          action,
          timestamp: new Date(),
        },
      ],
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setUsage: (usage) => set({ usage }),

  clearMessages: () => set({ messages: [] }),
}));
