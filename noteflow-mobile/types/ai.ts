export type AIAction = 'summarize' | 'expand' | 'improve' | 'translate' | 'ideas' | 'freePrompt';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  action?: AIAction;
  timestamp: Date;
}

export interface AIUsage {
  count: number;
  date: string;
  limit: number;
}
