import { useAIStore } from "./ai-store";

beforeEach(() => {
  useAIStore.setState({
    panelOpen: false,
    messages: [],
    chatLoading: false,
  });
});

describe("AI Store — Panel", () => {
  it("opens panel", () => {
    useAIStore.getState().openPanel();
    expect(useAIStore.getState().panelOpen).toBe(true);
  });

  it("closes panel", () => {
    useAIStore.setState({ panelOpen: true });
    useAIStore.getState().closePanel();
    expect(useAIStore.getState().panelOpen).toBe(false);
  });

  it("toggles panel", () => {
    useAIStore.getState().togglePanel();
    expect(useAIStore.getState().panelOpen).toBe(true);
    useAIStore.getState().togglePanel();
    expect(useAIStore.getState().panelOpen).toBe(false);
  });
});

describe("AI Store — Messages", () => {
  it("adds a message with timestamp", () => {
    useAIStore.getState().addMessage("user", "Hello");
    const msgs = useAIStore.getState().messages;
    expect(msgs).toHaveLength(1);
    expect(msgs[0].role).toBe("user");
    expect(msgs[0].content).toBe("Hello");
    expect(msgs[0].timestamp).toBeTypeOf("number");
  });

  it("clears messages", () => {
    useAIStore.getState().addMessage("user", "Hello");
    useAIStore.getState().addMessage("assistant", "Hi");
    useAIStore.getState().clearMessages();
    expect(useAIStore.getState().messages).toHaveLength(0);
  });

  it("preserves existing messages when adding new ones", () => {
    useAIStore.getState().addMessage("user", "First");
    useAIStore.getState().addMessage("assistant", "Second");
    expect(useAIStore.getState().messages).toHaveLength(2);
    expect(useAIStore.getState().messages[0].content).toBe("First");
    expect(useAIStore.getState().messages[1].content).toBe("Second");
  });
});

describe("AI Store — chatLoading", () => {
  it("sets chatLoading", () => {
    useAIStore.getState().setChatLoading(true);
    expect(useAIStore.getState().chatLoading).toBe(true);
    useAIStore.getState().setChatLoading(false);
    expect(useAIStore.getState().chatLoading).toBe(false);
  });
});
