/**
 * Rate Limiting for API Usage
 * Sistema de rate limiting para controle de uso de APIs (Gemini)
 */

import * as admin from 'firebase-admin';

const db = admin.firestore();

// ============================================================
// Configurações de Rate Limiting
// ============================================================

export interface RateLimitConfig {
  dailyLimit: number;
  monthlyLimit: number;
  requestsPerMinute?: number;
  cooldownPeriod?: number; // em segundos
}

const DEFAULT_LIMITS: RateLimitConfig = {
  // Plano grátis do Google Gemini: 15 requisições por minuto
  requestsPerMinute: 15,
  // Limites mensais baseados em uso típico
  dailyLimit: 1000,
  monthlyLimit: 30000,
  // Período de cooldown para erros de rate limit
  cooldownPeriod: 60, // segundos
};

// ============================================================
// Tipos de Erros
// ============================================================

export enum RateLimitError {
  DAILY_LIMIT_EXCEEDED = 'DAILY_LIMIT_EXCEEDED',
  MONTHLY_LIMIT_EXCEEDED = 'MONTHLY_LIMIT_EXCEEDED',
  MINUTE_LIMIT_EXCEEDED = 'MINUTE_LIMIT_EXCEEDED',
  COOLDOWN_ACTIVE = 'COOLDOWN_ACTIVE',
}

export interface RateLimitResult {
  allowed: boolean;
  error?: RateLimitError;
  remaining?: {
    daily: number;
    monthly: number;
    minute?: number;
  };
  retryAfter?: number; // em segundos
}

// ============================================================
// Storage Keys
// ============================================================

const STORAGE_KEYS = {
  USAGE: 'ai_usage',
  USER_STATS: 'user_rate_limit_stats',
  COOLDOWN: 'user_cooldown',
};

// ============================================================
// Funções Auxiliares
// ============================================================

function getTodayKey(): string {
  const today = new Date().toISOString().slice(0, 10);
  return `${STORAGE_KEYS.USAGE}/${today}`;
}

function getMinuteKey(): string {
  const now = new Date();
  const minute = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return `${STORAGE_KEYS.USAGE}/minute/${minute}`;
}

// ============================================================
// Funções Principais
// ============================================================

/**
 * Verifica se o usuário pode fazer uma requisição
 * baseado nos limites configurados
 */
export async function checkRateLimit(
  userId: string
): Promise<RateLimitResult> {
  const now = Date.now();

  // 1. Obter estatísticas do usuário
  const statsRef = db.collection(STORAGE_KEYS.USER_STATS).doc(userId);
  const statsDoc = await statsRef.get();

  if (!statsDoc.exists) {
    // Usuário novo, criar estatísticas iniciais
    await statsRef.set({
      userId,
      dailyRequests: 0,
      dailyLimit: DEFAULT_LIMITS.dailyLimit,
      monthlyRequests: 0,
      monthlyLimit: DEFAULT_LIMITS.monthlyLimit,
      minuteRequests: {},
      minuteLimit: DEFAULT_LIMITS.requestsPerMinute || 60,
      lastUpdated: now,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return {
      allowed: true,
      remaining: {
        daily: DEFAULT_LIMITS.dailyLimit,
        monthly: DEFAULT_LIMITS.monthlyLimit,
        minute: DEFAULT_LIMITS.requestsPerMinute,
      },
    };
  }

  const stats = statsDoc.data()!;

  // 2. Verificar cooldown
  const cooldownRef = db.collection(STORAGE_KEYS.COOLDOWN).doc(userId);
  const cooldownDoc = await cooldownRef.get();

  if (cooldownDoc.exists) {
    const cooldownEnd = cooldownDoc.data()!.until?.toMillis() || 0;
    if (now < cooldownEnd) {
      return {
        allowed: false,
        error: RateLimitError.COOLDOWN_ACTIVE,
        retryAfter: Math.ceil((cooldownEnd - now) / 1000),
      };
    }
  }

  // 3. Calcular timestamp do minuto atual
  const currentMinuteKey = getMinuteKey();
  const minuteRequests = stats.minuteRequests || {};
  const requestsInMinute = minuteRequests[currentMinuteKey] || 0;

  if (DEFAULT_LIMITS.requestsPerMinute && requestsInMinute >= DEFAULT_LIMITS.requestsPerMinute) {
    return {
      allowed: false,
      error: RateLimitError.MINUTE_LIMIT_EXCEEDED,
      retryAfter: 60, // até o próximo minuto
    };
  }

  // 4. Verificar limite diário
  if (stats.dailyRequests >= stats.dailyLimit) {
    return {
      allowed: false,
      error: RateLimitError.DAILY_LIMIT_EXCEEDED,
      retryAfter: 86400, // até o próximo dia
    };
  }

  // 5. Verificar limite mensal
  if (stats.monthlyRequests >= stats.monthlyLimit) {
    return {
      allowed: false,
      error: RateLimitError.MONTHLY_LIMIT_EXCEEDED,
      retryAfter: 2592000, // até o próximo mês
    };
  }

  // 6. Permitir requisição
  return {
    allowed: true,
    remaining: {
      daily: stats.dailyLimit - stats.dailyRequests,
      monthly: stats.monthlyLimit - stats.monthlyRequests,
      minute: DEFAULT_LIMITS.requestsPerMinute ? (DEFAULT_LIMITS.requestsPerMinute - requestsInMinute) : undefined,
    },
  };
}

/**
 * Registra uma requisição bem-sucedida
 */
export async function recordSuccessfulRequest(
  userId: string,
  tokensUsed: number = 0
): Promise<void> {
  const now = Date.now();
  const today = getTodayKey();
  const minute = getMinuteKey();

  // Atualizar contadores
  const statsRef = db.collection(STORAGE_KEYS.USER_STATS).doc(userId);
  const updateData: any = {
    dailyRequests: admin.firestore.FieldValue.increment(1),
    monthlyRequests: admin.firestore.FieldValue.increment(1),
    lastUpdated: now,
    [`minuteRequests.${minute}`]: admin.firestore.FieldValue.increment(1),
  };

  await statsRef.update(updateData);

  // Resetar contadores se necessário (novo dia/mês)
  const statsDoc = await statsRef.get();
  const stats = statsDoc.data()!;

  if (stats.lastResetDate) {
    const lastReset = stats.lastResetDate.toDate?.getTime() || 0;
    const lastDay = Math.floor(lastReset / 86400000);
    const currentDay = Math.floor(now / 86400000);

    // Reset diário
    if (currentDay > lastDay) {
      await statsRef.update({
        dailyRequests: 0,
        lastResetDate: admin.firestore.Timestamp.fromDate(new Date()),
      });
    }

    // Reset mensal
    const lastMonthValue = Math.floor(lastReset / 2592000000);
    const currentMonthValue = Math.floor(now / 2592000000);
    if (currentMonthValue > lastMonthValue) {
      await statsRef.update({
        monthlyRequests: 0,
        lastResetDate: admin.firestore.Timestamp.fromDate(new Date()),
      });
    }
  }

  // Registrar uso detalhado
  const usageRef = db.collection(STORAGE_KEYS.USAGE).doc(today);
  await usageRef.set(
    {
      userId,
      timestamp: now,
      tokensUsed,
      endpoint: 'gemini',
    },
    { merge: true }
  );
}

/**
 * Ativa cooldown para usuário após erro de rate limit
 */
export async function activateCooldown(
  userId: string,
  reason: string,
  duration: number = DEFAULT_LIMITS.cooldownPeriod!
): Promise<void> {
  const cooldownRef = db.collection(STORAGE_KEYS.COOLDOWN).doc(userId);
  const until = new Date(Date.now() + duration * 1000);

  await cooldownRef.set({
    userId,
    reason,
    until: admin.firestore.Timestamp.fromDate(until),
    activatedAt: admin.firestore.Timestamp.fromDate(new Date()),
  });
}

/**
 * Remove cooldown do usuário
 */
export async function clearCooldown(userId: string): Promise<void> {
  const cooldownRef = db.collection(STORAGE_KEYS.COOLDOWN).doc(userId);
  await cooldownRef.delete();
}

/**
 * Obtém estatísticas de uso do usuário
 */
export async function getUserStats(userId: string): Promise<{
  dailyUsed: number;
  monthlyUsed: number;
  dailyLimit: number;
  monthlyLimit: number;
}> {
  const statsRef = db.collection(STORAGE_KEYS.USER_STATS).doc(userId);
  const statsDoc = await statsRef.get();

  if (!statsDoc.exists) {
    return {
      dailyUsed: 0,
      monthlyUsed: 0,
      dailyLimit: DEFAULT_LIMITS.dailyLimit,
      monthlyLimit: DEFAULT_LIMITS.monthlyLimit,
    };
  }

  const stats = statsDoc.data()!;
  return {
    dailyUsed: stats.dailyRequests || 0,
    monthlyUsed: stats.monthlyRequests || 0,
    dailyLimit: stats.dailyLimit,
    monthlyLimit: stats.monthlyLimit,
  };
}

/**
 * Resetar estatísticas de uso (para admin ou teste)
 */
export async function resetUserStats(userId: string): Promise<void> {
  const statsRef = db.collection(STORAGE_KEYS.USER_STATS).doc(userId);
  await statsRef.delete();

  const cooldownRef = db.collection(STORAGE_KEYS.COOLDOWN).doc(userId);
  await cooldownRef.delete();
}

/**
 * Configura limites personalizados para um usuário
 * (útil para planos premium)
 */
export async function setUserLimits(
  userId: string,
  limits: Partial<RateLimitConfig>
): Promise<void> {
  const statsRef = db.collection(STORAGE_KEYS.USER_STATS).doc(userId);
  const updateData: any = {
    lastUpdated: Date.now(),
  };

  if (limits.dailyLimit !== undefined) {
    updateData.dailyLimit = limits.dailyLimit;
  }
  if (limits.monthlyLimit !== undefined) {
    updateData.monthlyLimit = limits.monthlyLimit;
  }
  if (limits.requestsPerMinute !== undefined) {
    updateData.minuteLimit = limits.requestsPerMinute;
  }

  await statsRef.update(updateData);
}

export default {
  checkRateLimit,
  recordSuccessfulRequest,
  activateCooldown,
  clearCooldown,
  getUserStats,
  resetUserStats,
  setUserLimits,
  DEFAULT_LIMITS,
  RateLimitError,
};
