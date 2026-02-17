import { render, screen, waitFor } from "@/test/test-utils";
import DocumentsPage from "./page";

const { mockPush, mockGetDocument, mockCreateDocument, mockToast, mockUser, mockUserProfile } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockGetDocument: vi.fn(),
  mockCreateDocument: vi.fn(),
  mockToast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
  mockUser: { uid: "test-user-123", displayName: "Test User" },
  mockUserProfile: {
    displayName: "Maria Silva",
    recentDocIds: ["doc-1", "doc-2"],
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

vi.mock("@/lib/firebase/firestore", () => ({
  getDocument: (...args: unknown[]) => mockGetDocument(...args),
  createDocument: (...args: unknown[]) => mockCreateDocument(...args),
}));

vi.mock("sonner", () => ({ toast: mockToast }));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: mockUser,
    userProfile: mockUserProfile,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("DocumentsPage", () => {
  it("renders greeting with firstName", async () => {
    mockGetDocument.mockResolvedValue(null);
    render(<DocumentsPage />);
    // firstName = "Maria"
    expect(screen.getByText(/Maria/)).toBeInTheDocument();
  });

  it("loads recent docs via getDocument per ID and renders titles", async () => {
    mockGetDocument
      .mockResolvedValueOnce({
        id: "doc-1",
        title: "My First Doc",
        icon: "",
        isArchived: false,
      })
      .mockResolvedValueOnce({
        id: "doc-2",
        title: "Second Document",
        icon: "",
        isArchived: false,
      });

    render(<DocumentsPage />);

    await waitFor(() => {
      expect(screen.getByText("My First Doc")).toBeInTheDocument();
      expect(screen.getByText("Second Document")).toBeInTheDocument();
    });
  });

  it("renders doc.icon emoji when present", async () => {
    mockGetDocument.mockResolvedValueOnce({
      id: "doc-1",
      title: "Emoji Doc",
      icon: "🎉",
      isArchived: false,
    }).mockResolvedValueOnce(null);

    render(<DocumentsPage />);

    await waitFor(() => {
      expect(screen.getByText("🎉")).toBeInTheDocument();
    });
  });

  it("navigates on doc click", async () => {
    mockGetDocument.mockResolvedValueOnce({
      id: "doc-1",
      title: "Clickable Doc",
      icon: "",
      isArchived: false,
    }).mockResolvedValueOnce(null);

    const { user } = render(<DocumentsPage />);

    await waitFor(() => {
      expect(screen.getByText("Clickable Doc")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Clickable Doc"));
    expect(mockPush).toHaveBeenCalledWith("/documents/doc-1");
  });

  it("Nova página card creates document and navigates", async () => {
    mockGetDocument.mockResolvedValue(null);
    mockCreateDocument.mockResolvedValue("new-doc-id");

    const { user } = render(<DocumentsPage />);
    await user.click(screen.getByText("Nova página"));

    await waitFor(() => {
      expect(mockCreateDocument).toHaveBeenCalledWith("test-user-123", expect.objectContaining({ projectId: null }));
      expect(mockPush).toHaveBeenCalledWith("/documents/new-doc-id");
    });
  });
});
