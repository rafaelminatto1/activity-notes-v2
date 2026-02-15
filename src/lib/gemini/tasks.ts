import { generateText } from "./client";
import { AI_PROMPTS } from "./prompts";

export async function extractTasksFromContent(content: string): Promise<string[]> {
  if (!content || content.trim().length < 10) return [];

  try {
    const { text } = await generateText(AI_PROMPTS.extractTasks, content, {
      temperature: 0.1, // Baixa temperatura para precisão
    });

    // Limpar possíveis blocos de código markdown
    const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const tasks = JSON.parse(jsonString);
    if (Array.isArray(tasks)) {
      return tasks.filter((t): t is string => typeof t === 'string' && t.length > 0);
    }
    return [];
  } catch (error) {
    console.error("Falha ao extrair tarefas com IA:", error);
    return [];
  }
}
