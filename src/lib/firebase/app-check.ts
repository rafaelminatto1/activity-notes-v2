/**
 * Firebase App Check Configuration
 * Configuração do Firebase App Check para proteção de chamadas client-side
 *
 * App Check protege seus recursos de backend contra abusos
 * garantindo que requisições venham de apps legítimos
 */

import app from './config';
import {
  initializeAppCheck as firebaseInitializeAppCheck,
  ReCaptchaV3Provider,
  getToken,
  onTokenChanged,
  AppCheck,
  AppCheckTokenResult,
} from 'firebase/app-check';

let appCheckInstance: AppCheck | null = null;

/**
 * Inicializa o Firebase App Check
 * Deve ser chamado antes de fazer requisições ao backend
 */
export async function initializeAppCheck(): Promise<void> {
  if (!app) {
    console.warn('[AppCheck] Firebase app not initialized');
    return;
  }

  try {
    // Usa reCAPTCHA v3 para App Check
    appCheckInstance = firebaseInitializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(
        process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''
      ),
      isTokenAutoRefreshEnabled: true,
    });

    console.log('[AppCheck] Initialized successfully');
  } catch (error) {
    console.error('[AppCheck] Failed to initialize:', error);
  }
}

/**
 * Obtém um token válido do App Check
 * @param forceRefresh - Força a renovação do token
 */
export async function getAppCheckToken(forceRefresh = false): Promise<string | null> {
  if (!appCheckInstance) {
    console.warn('[AppCheck] Not initialized');
    return null;
  }

  try {
    const token = await getToken(appCheckInstance, forceRefresh);
    return token.token;
  } catch (error) {
    console.error('[AppCheck] Failed to get token:', error);
    return null;
  }
}

/**
 * Adiciona um listener para mudanças no token
 * Útil para monitorar quando o token é renovado
 */
export function onAppCheckTokenChanged(
  callback: (token: string | null) => void
): void {
  if (!appCheckInstance) {
    console.warn('[AppCheck] Not initialized');
    return;
  }

  onTokenChanged(appCheckInstance, (token: AppCheckTokenResult) => {
    const tokenValue = token ? token.token : null;
    callback(tokenValue);
  });
}

/**
 * Wrapper para fetch com App Check token
 * Adiciona automaticamente o token nas requisições
 */
export async function fetchWithAppCheck(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAppCheckToken();

  const headers = {
    ...options.headers,
    'X-Firebase-AppCheck-Token': token || '',
  };

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Verifica se o App Check está disponível
 */
export function isAppCheckAvailable(): boolean {
  return appCheckInstance !== null;
}

const appCheckUtils = {
  initializeAppCheck,
  getAppCheckToken,
  onAppCheckTokenChanged,
  fetchWithAppCheck,
  isAppCheckAvailable,
};

export default appCheckUtils;
