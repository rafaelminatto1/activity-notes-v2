import { render, screen, waitFor } from "@/test/test-utils";
import { AIPanel } from "@/components/ai/ai-panel";
import { useAIStore } from "@/stores/ai-store";

const { mockToast } = vi.hoisted(() => ({
  mockToast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

vi.mock("sonner", () => ({ toast: mockToast }));

beforeEach(() => {
  vi.clearAllMocks();
  useAIStore.setState({
    panelOpen: true,
    messages: [],
    chatLoading: false,
  });
});

describe("AI Flow Integration", () => {
  it("full chat: type → send → onChat → response displayed → insert to document", async () => {
    const onChat = vi.fn().mockResolvedValue("Here is your summary");
    const onInsertToDocument = vi.fn();

    const { user } = render(
      <AIPanel
        onChat={onChat}
        onInsertToDocument={onInsertToDocument}
        documentContext="Document text here"
        loading={false}
        usage={{ count: 0, remaining: 50, limit: 50 }}
      />
    );

    // Type and send message
    const textarea = screen.getByPlaceholderText("Pergunte algo sobre seu documento...");
    await user.type(textarea, "Summarize this");
    await user.keyboard("{Enter}");

    // Verify onChat was called
    await waitFor(() => {
      expect(onChat).toHaveBeenCalledWith("Summarize this", "Document text here");
    });

    // Response should be displayed
    await waitFor(() => {
      expect(screen.getByText("Here is your summary")).toBeInTheDocument();
    });

    // Click insert button to insert to document
    const insertBtn = screen.getByTitle("Inserir no documento");
    await user.click(insertBtn);
    expect(onInsertToDocument).toHaveBeenCalledWith("Here is your summary");
  });

  it("error: onChat rejects → fallback message", async () => {
    const onChat = vi.fn().mockRejectedValue(new Error("API Error"));

    const { user } = render(
      <AIPanel
        onChat={onChat}
        documentContext=""
        loading={false}
        usage={{ count: 0, remaining: 50, limit: 50 }}
      />
    );

    const textarea = screen.getByPlaceholderText("Pergunte algo sobre seu documento...");
    await user.type(textarea, "test");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(
        screen.getByText("Desculpe, ocorreu um erro ao processar sua mensagem.")
      ).toBeInTheDocument();
    });
  });

  it("multi-turn: 2 user messages → store has 4 entries (2 user + 2 assistant)", async () => {
    let callCount = 0;
    const onChat = vi.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve(`Response ${callCount}`);
    });

    const { user } = render(
      <AIPanel
        onChat={onChat}
        documentContext=""
        loading={false}
        usage={{ count: 0, remaining: 50, limit: 50 }}
      />
    );

    const textarea = screen.getByPlaceholderText("Pergunte algo sobre seu documento...");

    // First message
    await user.type(textarea, "First question");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(screen.getByText("Response 1")).toBeInTheDocument();
    });

    // Second message
    await user.type(textarea, "Second question");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(screen.getByText("Response 2")).toBeInTheDocument();
    });

    // Verify store has 4 entries
    const messages = useAIStore.getState().messages;
    expect(messages).toHaveLength(4);
    expect(messages[0].role).toBe("user");
    expect(messages[1].role).toBe("assistant");
    expect(messages[2].role).toBe("user");
    expect(messages[3].role).toBe("assistant");
  });
});
