export const AI_PROMPTS = {
  summarize:
    "Resuma o seguinte texto em 2-3 parágrafos concisos em português. Mantenha os pontos-chave e a essência da mensagem. Não adicione informações que não estejam no texto original.",

  expand:
    "Continue e expanda o texto a seguir mantendo o tom e estilo do autor. Adicione mais detalhes, exemplos e profundidade. Responda no mesmo idioma do texto de entrada.",

  improve:
    "Melhore a escrita do texto mantendo o significado original. Corrija gramática, melhore a clareza, a coesão e a legibilidade. Mantenha o mesmo tom e estilo. Retorne apenas o texto melhorado, sem explicações.",

  simplify:
    "Simplifique o texto a seguir para torná-lo mais fácil de entender. Use palavras mais simples e frases mais curtas, mantendo as ideias principais. Responda no mesmo idioma do texto de entrada.",

  fixSpelling:
    "Corrija todos os erros de ortografia e gramática no texto a seguir. Retorne apenas o texto corrigido, sem explicações. Mantenha a formatação original.",

  continueWriting:
    "Continue escrevendo naturalmente a partir de onde o texto termina. Mantenha o estilo, o tom e o assunto. Escreva 2-3 parágrafos. Responda no mesmo idioma do texto de entrada.",

  changeTone: (tone: string) =>
    `Reescreva o texto a seguir em um tom ${tone}. Mantenha o significado original. Retorne apenas o texto reescrito. Responda no mesmo idioma do texto de entrada.`,

  translate: (language: string) =>
    `Traduza o texto a seguir para ${language}. Mantenha a formatação original. Retorne apenas a tradução, sem explicações.`,

  generateFromPrompt: (prompt: string) =>
    `Você é um assistente de escrita inteligente. Siga esta instrução do usuário:\n\n${prompt}\n\nResponda no mesmo idioma da instrução acima. Seja conciso e direto.`,
} as const;

export const SYSTEM_PROMPT =
  "Você é um assistente de escrita integrado ao Activity Notes, um app de notas. " +
  "Suas respostas devem ser concisas, úteis e no idioma do usuário. " +
  "Quando perguntado sobre o conteúdo do documento, analise o contexto fornecido. " +
  "Não use markdown excessivo — mantenha a formatação simples e legível. " +
  "Se não souber algo, diga honestamente.";

export type AIPromptKey = keyof typeof AI_PROMPTS;
