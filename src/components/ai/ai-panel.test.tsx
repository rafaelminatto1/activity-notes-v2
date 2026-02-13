import { render, screen, waitFor } from "@/test/test-utils";
import { AIPanel } from "./ai-panel";
import { useAIStore } from "@/stores/ai-store";

const { mockToast } = vi.hoisted(() => ({
  mockToast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

vi.mock("sonner", () => ({ toast: mockToast }));

const defaultProps = {
  onChat: vi.fn().mockResolvedValue("AI response"),
  onInsertToDocument: vi.fn(),
  documentContext: "Some document text",
  loading: false,
  usage: { count: 5, remaining: 45, limit: 50 },
};

beforeEach(() => {
  vi.clearAllMocks();
  useAIStore.setState({
    panelOpen: true,
    messages: [],
    chatLoading: false,
  });
});

describe("AIPanel", () => {
  it("renders 'Assistente IA' title", () => {
    render(<AIPanel {...defaultProps} />);
    expect(screen.getByText("Assistente IA")).toBeInTheDocument();
  });

  it("renders usage remaining text", () => {
    render(<AIPanel {...defaultProps} />);
    expect(screen.getByText("45 usos restantes hoje")).toBeInTheDocument();
  });

  it("renders usage count/limit", () => {
    render(<AIPanel {...defaultProps} />);
    expect(screen.getByText("5/50")).toBeInTheDocument();
  });

  it("shows quick prompts when messages are empty", () => {
    render(<AIPanel {...defaultProps} />);
    expect(screen.getByText("Resuma este documento")).toBeInTheDocument();
  });

  it("sends message via onChat and displays response in store", async () => {
    const onChat = vi.fn().mockResolvedValue("AI answer");
    const { user } = render(<AIPanel {...defaultProps} onChat={onChat} />);

    const textarea = screen.getByPlaceholderText("Pergunte algo sobre seu documento...");
    await user.type(textarea, "Hello AI");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(onChat).toHaveBeenCalledWith("Hello AI", "Some document text");
    });

    await waitFor(() => {
      const messages = useAIStore.getState().messages;
      expect(messages.some((m) => m.role === "user" && m.content === "Hello AI")).toBe(true);
      expect(messages.some((m) => m.role === "assistant" && m.content === "AI answer")).toBe(true);
    });
  });

  it("renders existing messages from store", () => {
    useAIStore.setState({
      panelOpen: true,
      messages: [
        { role: "user", content: "Test question", timestamp: Date.now() },
        { role: "assistant", content: "Test answer", timestamp: Date.now() },
      ],
      chatLoading: false,
    });

    render(<AIPanel {...defaultProps} />);
    expect(screen.getByText("Test question")).toBeInTheDocument();
    expect(screen.getByText("Test answer")).toBeInTheDocument();
  });

  it("shows 'Pensando...' when chatLoading is true", () => {
    useAIStore.setState({
      panelOpen: true,
      messages: [],
      chatLoading: true,
    });

    render(<AIPanel {...defaultProps} />);
    expect(screen.getByText("Pensando...")).toBeInTheDocument();
  });

  it("copy button calls navigator.clipboard.writeText", async () => {
    const writeTextSpy = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);

    useAIStore.setState({
      panelOpen: true,
      messages: [
        { role: "assistant", content: "Copy this text", timestamp: Date.now() },
      ],
      chatLoading: false,
    });

    const { user } = render(<AIPanel {...defaultProps} />);
    const copyBtn = screen.getByTitle("Copiar");
    await user.click(copyBtn);

    expect(writeTextSpy).toHaveBeenCalledWith("Copy this text");
  });

  it("insert button calls onInsertToDocument", async () => {
    const onInsertToDocument = vi.fn();
    useAIStore.setState({
      panelOpen: true,
      messages: [
        { role: "assistant", content: "Insert this", timestamp: Date.now() },
      ],
      chatLoading: false,
    });

    const { user } = render(
      <AIPanel {...defaultProps} onInsertToDocument={onInsertToDocument} />
    );
    const insertBtn = screen.getByTitle("Inserir no documento");
    await user.click(insertBtn);

    expect(onInsertToDocument).toHaveBeenCalledWith("Insert this");
  });

  it("shows error message when onChat rejects", async () => {
    const onChat = vi.fn().mockRejectedValue(new Error("API Error"));
    const { user } = render(<AIPanel {...defaultProps} onChat={onChat} />);

    const textarea = screen.getByPlaceholderText("Pergunte algo sobre seu documento...");
    await user.type(textarea, "Fail");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(
        screen.getByText("Desculpe, ocorreu um erro ao processar sua mensagem.")
      ).toBeInTheDocument();
    });
  });

  it("disables textarea when usage.remaining <= 0", () => {
    render(
      <AIPanel
        {...defaultProps}
        usage={{ count: 50, remaining: 0, limit: 50 }}
      />
    );
    const textarea = screen.getByPlaceholderText("Pergunte algo sobre seu documento...");
    expect(textarea).toBeDisabled();
  });
});
