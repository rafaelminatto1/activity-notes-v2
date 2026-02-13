import { renderHook, act } from "@testing-library/react";
import { useSearch } from "./use-search";

const mockSearch = vi.fn();
const mockTrack = vi.fn();

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: { uid: "test-user-123" },
  }),
}));

vi.mock("@/lib/firebase/firestore", () => ({
  searchDocuments: (...args: unknown[]) => mockSearch(...args),
}));

vi.mock("@/lib/firebase/analytics", () => ({
  trackSearchPerformed: () => mockTrack(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useSearch", () => {
  it("starts with empty state", () => {
    const { result } = renderHook(() => useSearch());
    expect(result.current.results).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it("search calls searchDocuments and trackSearchPerformed", async () => {
    const docs = [{ id: "1", title: "Test" }];
    mockSearch.mockResolvedValue(docs);

    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await result.current.search("test");
    });

    expect(mockSearch).toHaveBeenCalledWith("test-user-123", "test");
    expect(mockTrack).toHaveBeenCalled();
    expect(result.current.results).toEqual(docs);
  });

  it("empty string does not call searchDocuments", async () => {
    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await result.current.search("");
    });

    expect(mockSearch).not.toHaveBeenCalled();
    expect(result.current.results).toEqual([]);
  });

  it("clear resets results", async () => {
    const docs = [{ id: "1", title: "Test" }];
    mockSearch.mockResolvedValue(docs);

    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await result.current.search("test");
    });
    expect(result.current.results).toHaveLength(1);

    act(() => {
      result.current.clear();
    });
    expect(result.current.results).toEqual([]);
  });
});
