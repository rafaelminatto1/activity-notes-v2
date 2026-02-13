const STORAGE_KEY = "activity-notes-ai-usage";
const DAILY_LIMIT = 50;

interface StoredUsage {
  date: string; // YYYY-MM-DD in Pacific time
  count: number;
  lastRequestAt: number;
}

function getPacificDate(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Los_Angeles",
  });
}

function getUsage(): StoredUsage {
  if (typeof window === "undefined") {
    return { date: getPacificDate(), count: 0, lastRequestAt: 0 };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: getPacificDate(), count: 0, lastRequestAt: 0 };

    const stored: StoredUsage = JSON.parse(raw);
    const today = getPacificDate();

    // Reset if date changed (new day in Pacific)
    if (stored.date !== today) {
      return { date: today, count: 0, lastRequestAt: 0 };
    }

    return stored;
  } catch {
    return { date: getPacificDate(), count: 0, lastRequestAt: 0 };
  }
}

function saveUsage(usage: StoredUsage): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
  } catch {
    // localStorage full or unavailable — ignore
  }
}

export function getAIUsage(): { count: number; remaining: number; limit: number } {
  const usage = getUsage();
  return {
    count: usage.count,
    remaining: Math.max(0, DAILY_LIMIT - usage.count),
    limit: DAILY_LIMIT,
  };
}

export function incrementAIUsage(): { count: number; remaining: number; limit: number } {
  const usage = getUsage();
  usage.count++;
  usage.lastRequestAt = Date.now();
  saveUsage(usage);
  return {
    count: usage.count,
    remaining: Math.max(0, DAILY_LIMIT - usage.count),
    limit: DAILY_LIMIT,
  };
}

export function hasAIUsageRemaining(): boolean {
  return getUsage().count < DAILY_LIMIT;
}
