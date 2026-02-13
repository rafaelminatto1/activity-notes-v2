import { useEditorStore } from "./editor-store";

beforeEach(() => {
  vi.useFakeTimers();
  useEditorStore.setState({ saveStatus: "idle", lastSaved: null });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("Editor Store", () => {
  it("setSaving sets status to saving", () => {
    useEditorStore.getState().setSaving();
    expect(useEditorStore.getState().saveStatus).toBe("saving");
  });

  it("setSaved sets status to saved and auto-reverts to idle after 3s", () => {
    useEditorStore.getState().setSaved();
    expect(useEditorStore.getState().saveStatus).toBe("saved");
    expect(useEditorStore.getState().lastSaved).toBeInstanceOf(Date);

    vi.advanceTimersByTime(3000);
    expect(useEditorStore.getState().saveStatus).toBe("idle");
  });

  it("setError sets status to error", () => {
    useEditorStore.getState().setError();
    expect(useEditorStore.getState().saveStatus).toBe("error");
  });

  it("setIdle sets status to idle", () => {
    useEditorStore.setState({ saveStatus: "saving" });
    useEditorStore.getState().setIdle();
    expect(useEditorStore.getState().saveStatus).toBe("idle");
  });

  it("setSaving cancels pending revert timeout from setSaved", () => {
    useEditorStore.getState().setSaved();
    expect(useEditorStore.getState().saveStatus).toBe("saved");

    // Before 3s, start saving again
    vi.advanceTimersByTime(1000);
    useEditorStore.getState().setSaving();
    expect(useEditorStore.getState().saveStatus).toBe("saving");

    // After original 3s would have elapsed, status should still be saving (not idle)
    vi.advanceTimersByTime(2000);
    expect(useEditorStore.getState().saveStatus).toBe("saving");
  });
});
