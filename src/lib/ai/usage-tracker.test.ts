import { getAIUsage, incrementAIUsage, hasAIUsageRemaining } from "./usage-tracker";

const STORAGE_KEY = "activity-notes-ai-usage";

beforeEach(() => {
  localStorage.clear();
});

describe("getAIUsage()", () => {
  it("returns zero when localStorage is empty", () => {
    const usage = getAIUsage();
    expect(usage.count).toBe(0);
    expect(usage.remaining).toBe(50);
    expect(usage.limit).toBe(50);
  });

  it("reads stored value", () => {
    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "America/Los_Angeles",
    });
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ date: today, count: 10, lastRequestAt: Date.now() })
    );
    const usage = getAIUsage();
    expect(usage.count).toBe(10);
    expect(usage.remaining).toBe(40);
  });

  it("resets on new day", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ date: "2000-01-01", count: 30, lastRequestAt: 0 })
    );
    const usage = getAIUsage();
    expect(usage.count).toBe(0);
    expect(usage.remaining).toBe(50);
  });

  it("handles corrupt JSON gracefully", () => {
    localStorage.setItem(STORAGE_KEY, "not-json");
    const usage = getAIUsage();
    expect(usage.count).toBe(0);
    expect(usage.remaining).toBe(50);
  });
});

describe("incrementAIUsage()", () => {
  it("increments from zero", () => {
    const usage = incrementAIUsage();
    expect(usage.count).toBe(1);
    expect(usage.remaining).toBe(49);
  });

  it("persists to localStorage", () => {
    incrementAIUsage();
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(raw.count).toBe(1);
  });

  it("is cumulative", () => {
    incrementAIUsage();
    incrementAIUsage();
    const usage = incrementAIUsage();
    expect(usage.count).toBe(3);
    expect(usage.remaining).toBe(47);
  });
});

describe("hasAIUsageRemaining()", () => {
  it("returns true when under limit", () => {
    expect(hasAIUsageRemaining()).toBe(true);
  });

  it("returns false at limit", () => {
    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "America/Los_Angeles",
    });
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ date: today, count: 50, lastRequestAt: Date.now() })
    );
    expect(hasAIUsageRemaining()).toBe(false);
  });

  it("returns false over limit", () => {
    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "America/Los_Angeles",
    });
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ date: today, count: 100, lastRequestAt: Date.now() })
    );
    expect(hasAIUsageRemaining()).toBe(false);
  });
});
