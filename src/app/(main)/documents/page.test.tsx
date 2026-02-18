import { render, screen, waitFor } from "@/test/test-utils";
import DocumentsPage from "./page";

const {
  mockPush,
  mockGetDocument,
  mockCreateDocument,
  mockSubscribeToUserProjects,
  mockSubscribeToMemberProjects,
  mockSubscribeToSpaces,
  mockToast,
  mockUser,
  mockUserProfile,
} = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockGetDocument: vi.fn(),
  mockCreateDocument: vi.fn(),
  mockSubscribeToUserProjects: vi.fn(),
  mockSubscribeToMemberProjects: vi.fn(),
  mockSubscribeToSpaces: vi.fn(),
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
  subscribeToProjectDocuments: vi.fn(() => () => {}),
  subscribeToSpaceDocuments: vi.fn(() => () => {}),
}));

vi.mock("@/lib/firebase/projects", () => ({
  getProject: vi.fn(),
  subscribeToUserProjects: (...args: unknown[]) => mockSubscribeToUserProjects(...args),
  subscribeToMemberProjects: (...args: unknown[]) => mockSubscribeToMemberProjects(...args),
}));

vi.mock("@/lib/firebase/spaces", () => ({
  createSpace: vi.fn(),
  subscribeToSpaces: (...args: unknown[]) => mockSubscribeToSpaces(...args),
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
  mockSubscribeToUserProjects.mockImplementation((_uid: string, cb: (items: unknown[]) => void) => {
    cb([]);
    return () => {};
  });
  mockSubscribeToMemberProjects.mockImplementation((_uid: string, cb: (items: unknown[]) => void) => {
    cb([]);
    return () => {};
  });
  mockSubscribeToSpaces.mockImplementation((_uid: string, cb: (items: unknown[]) => void) => {
    cb([]);
    return () => {};
  });
});

describe("DocumentsPage", () => {
  it("renders greeting with firstName", async () => {
    mockGetDocument.mockResolvedValue(null);
    render(<DocumentsPage />);
    expect(screen.getByText(/Maria/)).toBeInTheDocument();
  });

  it("loads recent docs via getDocument per ID and renders titles", async () => {
    mockGetDocument.mockImplementation(async (id: string) => {
      if (id === "doc-1") {
        return {
          id: "doc-1",
          title: "My First Doc",
          icon: "",
          isArchived: false,
        };
      }
      if (id === "doc-2") {
        return {
          id: "doc-2",
          title: "Second Document",
          icon: "",
          isArchived: false,
        };
      }
      return null;
    });

    render(<DocumentsPage />);

    await waitFor(() => {
      expect(screen.getByText("My First Doc")).toBeInTheDocument();
      expect(screen.getByText("Second Document")).toBeInTheDocument();
    });
  });

  it("navigates on doc click", async () => {
    mockGetDocument.mockImplementation(async (id: string) => {
      if (id === "doc-1") {
        return {
          id: "doc-1",
          title: "Clickable Doc",
          icon: "",
          isArchived: false,
        };
      }
      return null;
    });

    const { user } = render(<DocumentsPage />);

    await waitFor(() => {
      expect(screen.getByText("Clickable Doc")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Clickable Doc"));
    expect(mockPush).toHaveBeenCalledWith("/documents/doc-1");
  });

  it("Pasta card navigates to /pastas", async () => {
    mockGetDocument.mockResolvedValue(null);

    const { user } = render(<DocumentsPage />);
    await user.click(screen.getByText("Pasta"));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/pastas");
    });
  });
});
