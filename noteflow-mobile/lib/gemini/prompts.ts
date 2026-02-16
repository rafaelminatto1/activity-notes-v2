import { AIAction } from '@/types/ai';

export const AI_PROMPTS: Record<AIAction, (content: string) => string> = {
  summarize: (content: string) =>
    `Resuma o seguinte texto de forma concisa e clara, mantendo os pontos principais:\n\n${content}`,
  expand: (content: string) =>
    `Expanda o seguinte texto com mais detalhes, exemplos e explicações:\n\n${content}`,
  improve: (content: string) =>
    `Melhore a escrita do seguinte texto, tornando-o mais claro, profissional e bem estruturado:\n\n${content}`,
  translate: (content: string) =>
    `Traduza o seguinte texto para inglês. Se já estiver em inglês, traduza para português:\n\n${content}`,
  ideas: (content: string) =>
    `Com base no seguinte conteúdo, sugira 5 ideias relacionadas para expandir ou complementar o texto:\n\n${content}`,
  freePrompt: (content: string) => content,
};

export const AI_ACTION_LABELS: Record<AIAction, string> = {
  summarize: '📋 Resumir',
  expand: '📝 Expandir',
  improve: '✨ Melhorar',
  translate: '🌍 Traduzir',
  ideas: '💡 Ideias',
  freePrompt: '💬 Perguntar',
};
