import { logEvent, setUserProperties, setUserId } from "firebase/analytics";
import { analytics } from "./config";

// ---- Core helper ----

export function trackEvent(
  name: string,
  params?: Record<string, string | number | boolean>
) {
  if (!analytics) return;
  try {
    logEvent(analytics, name, params);
  } catch {
    // Silently ignore analytics errors
  }
}

// ---- User identity ----

export function setAnalyticsUser(
  userId: string,
  properties?: Record<string, string | boolean>
) {
  if (!analytics) return;
  try {
    setUserId(analytics, userId);
    if (properties) {
      setUserProperties(analytics, properties);
    }
  } catch {
    // Silently ignore
  }
}

export function setAnalyticsUserProperties(
  properties: Record<string, string | boolean>
) {
  if (!analytics) return;
  try {
    setUserProperties(analytics, properties);
  } catch {
    // Silently ignore
  }
}

// ---- Page views ----

export function trackPageView(pageName: string) {
  trackEvent("page_view", { page_title: pageName });
}

// ---- Documents ----

export function trackDocumentCreated() {
  trackEvent("document_created");
}

export function trackDocumentDeleted() {
  trackEvent("document_deleted");
}

export function trackDocumentPublished(published: boolean) {
  trackEvent("document_published", { published });
}

// ---- AI ----

export function trackAIUsed(action: string) {
  trackEvent("ai_used", { action });
}

// ---- Search ----

export function trackSearchPerformed() {
  trackEvent("search_performed");
}

// ---- Settings ----

export function trackThemeChanged(theme: string) {
  trackEvent("theme_changed", { theme });
}

// ---- Editor ----

export function trackSlashCommandUsed(command: string) {
  trackEvent("editor_slash_command_used", { command });
}

// ---- Performance traces ----

let perfModule: typeof import("firebase/performance") | null = null;
let perf: import("firebase/performance").FirebasePerformance | null = null;

async function getPerf() {
  if (perf) return perf;
  if (typeof window === "undefined") return null;

  try {
    const app = (await import("./config")).default;
    if (!app) return null;
    perfModule = await import("firebase/performance");
    perf = perfModule.getPerformance(app);
    return perf;
  } catch {
    return null;
  }
}

export async function startTrace(
  traceName: string
): Promise<{ stop: () => void } | null> {
  const p = await getPerf();
  if (!p || !perfModule) return null;
  try {
    const trace = perfModule.trace(p, traceName);
    trace.start();
    return { stop: () => trace.stop() };
  } catch {
    return null;
  }
}
