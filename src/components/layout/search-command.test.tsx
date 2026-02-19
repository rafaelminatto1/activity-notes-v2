import { render, screen, waitFor } from "@/test/test-utils";
import { act } from "@testing-library/react";
import { SearchCommand } from "./search-command";
import { useSearchStore } from "@/stores/search-store";

const {
  mockPush,
  mockCloseMobile,
  mockUser,
  mockSubscribeToRealtimeSearchIndex,
  emitSearchState,
} = vi.hoisted(() => {
  let callback:
    | ((state: { records: unknown[]; isReady: boolean }) => void)
    | null = null;

  return {
    mockPush: vi.fn(),
    mockCloseMobile: vi.fn(),
    mockUser: { uid: "user-1" },
    mockSubscribeToRealtimeSearchIndex: vi.fn(
      (_userId: string, cb: (state: { records: unknown[]; isReady: boolean }) => void) => {
        callback = cb;
        cb({ records: [], isReady: true });
        return vi.fn();
      }
    ),
    emitSearchState: (state: { records: unknown[]; isReady: boolean }) => {
      callback?.(state);
    },
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: mockUser,
    ready: true,
  }),
}));

vi.mock("@/stores/sidebar-store", () => ({
  useSidebarStore: (
    selector: (state: { closeMobile: () => void }) => unknown
  ) =>
    selector({
      closeMobile: mockCloseMobile,
    }),
}));

vi.mock("@/lib/search/realtime-search", () => ({
  subscribeToRealtimeSearchIndex: (
    userId: string,
    cb: (state: { records: unknown[]; isReady: boolean }) => void
  ) => mockSubscribeToRealtimeSearchIndex(userId, cb),
}));

beforeEach(() => {
  vi.clearAllMocks();
  useSearchStore.setState({ isOpen: true });
});

describe("SearchCommand", () => {
  it("renders search input with current placeholder", () => {
    render(<SearchCommand />);
    expect(
      screen.getByPlaceholderText("Buscar em todo o workspace...")
    ).toBeInTheDocument();
  });

  it("shows helper message when query is empty", () => {
    render(<SearchCommand />);
    expect(
      screen.getByText("Digite para buscar documentos, tarefas e comentários.")
    ).toBeInTheDocument();
  });

  it("renders realtime results when query matches", async () => {
    const { user } = render(<SearchCommand />);

    act(() => {
      emitSearchState({
        isReady: true,
        records: [
          {
            objectID: "document:doc-1",
            type: "document",
            title: "Test Document",
            content: "some text",
            url: "/documents/doc-1",
            createdAt: Date.now(),
          },
        ],
      });
    });

    const input = screen.getByPlaceholderText("Buscar em todo o workspace...");
    await user.type(input, "Test");

    await waitFor(() => {
      expect(screen.getByText("Test Document")).toBeInTheDocument();
    });
  });

  it("navigates when selecting a result", async () => {
    const { user } = render(<SearchCommand />);

    act(() => {
      emitSearchState({
        isReady: true,
        records: [
          {
            objectID: "document:doc-1",
            type: "document",
            title: "Test Document",
            content: "some text",
            url: "/documents/doc-1",
            createdAt: Date.now(),
          },
        ],
      });
    });

    const input = screen.getByPlaceholderText("Buscar em todo o workspace...");
    await user.type(input, "Test");

    const result = await screen.findByText("Test Document");
    await user.click(result);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/documents/doc-1");
    });
  });
});
