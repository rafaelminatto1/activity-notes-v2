import { GoogleGenerativeAI } from '@google/generative-ai';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
const DAILY_LIMIT = 50;
const STORAGE_KEY = 'ai_usage';

if (!API_KEY) {
  console.warn('GEMINI_API_KEY não está configurada no ambiente.');
}

const genAI = new GoogleGenerativeAI(API_KEY);

export async function getAIUsage(): Promise<{ count: number; date: string }> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (!stored) return { count: 0, date: new Date().toISOString().split('T')[0] };

  const usage = JSON.parse(stored);
  const today = new Date().toISOString().split('T')[0];

  if (usage.date !== today) {
    return { count: 0, date: today };
  }
  return usage;
}

async function incrementUsage(): Promise<number> {
  const usage = await getAIUsage();
  const today = new Date().toISOString().split('T')[0];
  const newCount = usage.date === today ? usage.count + 1 : 1;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ count: newCount, date: today }));
  return newCount;
}

export async function canUseAI(): Promise<boolean> {
  const usage = await getAIUsage();
  const today = new Date().toISOString().split('T')[0];
  if (usage.date !== today) return true;
  return usage.count < DAILY_LIMIT;
}

export async function generateAIResponse(prompt: string, context?: string): Promise<string> {
  const allowed = await canUseAI();
  if (!allowed) {
    throw new Error('Limite diário de IA atingido. Tente novamente amanhã.');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

  const fullPrompt = context
    ? `Contexto do documento:\n${context}\n\nSolicitação: ${prompt}`
    : prompt;

  const result = await model.generateContent(fullPrompt);
  const response = result.response;
  const text = response.text();

  await incrementUsage();
  return text;
}
