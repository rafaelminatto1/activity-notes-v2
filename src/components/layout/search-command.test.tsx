import { render, screen, waitFor } from "@/test/test-utils";
import { SearchCommand } from "./search-command";
import { useSearchStore } from "@/stores/search-store";

const { mockPush, mockSearchFn, mockClearFn } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockSearchFn: vi.fn(),
  mockClearFn: vi.fn(),
}));

let mockResults: unknown[] = [];

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-search", () => ({
  useSearch: () => ({
    results: mockResults,
    loading: false,
    search: mockSearchFn,
    clear: mockClearFn,
  }),
}));

vi.mock("@/stores/sidebar-store", () => ({
  useSidebarStore: () => vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockResults = [];
  useSearchStore.setState({ isOpen: true });
});

describe("SearchCommand", () => {
  it("renders search input with placeholder", () => {
    render(<SearchCommand />);
    expect(screen.getByPlaceholderText("Buscar documentos...")).toBeInTheDocument();
  });

  it("calls search when 2+ chars typed", async () => {
    const { user } = render(<SearchCommand />);
    const input = screen.getByPlaceholderText("Buscar documentos...");
    await user.type(input, "te");
    await waitFor(() => {
      expect(mockSearchFn).toHaveBeenCalled();
    });
  });

  it("shows empty state message", async () => {
    const { user } = render(<SearchCommand />);
    const input = screen.getByPlaceholderText("Buscar documentos...");
    await user.type(input, "xyz");

    await waitFor(() => {
      expect(screen.getByText(/nenhum documento encontrado/i)).toBeInTheDocument();
    });
  });

  it("renders results when available", async () => {
    mockResults = [
      { id: "doc-1", title: "Test Document", icon: "", plainText: "" },
    ];

    render(<SearchCommand />);

    await waitFor(() => {
      expect(screen.getByText("Test Document")).toBeInTheDocument();
    });
  });
});
