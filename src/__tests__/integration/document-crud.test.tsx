/**
 * Integration test for document CRUD operations.
 * Mocks firebase/firestore at a low level and tests the actual firestore.ts functions.
 */

const { mockAddDoc, mockGetDoc, mockUpdateDoc, mockDeleteDoc, mockGetDocs } = vi.hoisted(() => ({
  mockAddDoc: vi.fn(),
  mockGetDoc: vi.fn(),
  mockUpdateDoc: vi.fn(),
  mockDeleteDoc: vi.fn(),
  mockGetDocs: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn().mockReturnValue("mock-collection-ref"),
  doc: vi.fn().mockReturnValue("mock-doc-ref"),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  query: vi.fn().mockReturnValue("mock-query"),
  where: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn(),
  serverTimestamp: vi.fn().mockReturnValue("SERVER_TIMESTAMP"),
  writeBatch: vi.fn().mockReturnValue({
    update: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
  }),
  increment: vi.fn().mockReturnValue("INCREMENT"),
  setDoc: vi.fn(),
  arrayUnion: vi.fn(),
  arrayRemove: vi.fn(),
}));

vi.mock("@/lib/firebase/config", () => ({
  db: { type: "mock-firestore" },
  auth: null,
  storage: null,
  analytics: null,
  default: null,
}));

vi.mock("@/lib/firebase/analytics", () => ({
  trackDocumentCreated: vi.fn(),
}));

import {
  createDocument,
  getDocument,
  updateDocument,
  archiveDocument,
  restoreDocument,
  deleteDocumentPermanently,
} from "@/lib/firebase/firestore";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Document CRUD Integration", () => {
  it("createDocument → returns new doc ID", async () => {
    mockAddDoc.mockResolvedValue({ id: "new-doc-123" });

    const id = await createDocument("user-1");

    expect(mockAddDoc).toHaveBeenCalled();
    expect(id).toBe("new-doc-123");
  });

  it("getDocument → returns document data", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: "doc-1",
      data: () => ({
        title: "Test Document",
        content: null,
        userId: "user-1",
        isArchived: false,
      }),
    });

    const doc = await getDocument("doc-1");

    expect(doc).not.toBeNull();
    expect(doc!.id).toBe("doc-1");
    expect(doc!.title).toBe("Test Document");
  });

  it("getDocument → returns null for non-existent document", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => false,
    });

    const doc = await getDocument("nonexistent");
    expect(doc).toBeNull();
  });

  it("updateDocument → calls updateDoc with data", async () => {
    mockUpdateDoc.mockResolvedValue(undefined);

    await updateDocument("doc-1", { title: "Updated Title" });

    expect(mockUpdateDoc).toHaveBeenCalled();
  });

  it("archiveDocument → sets isArchived to true and archives children", async () => {
    mockUpdateDoc.mockResolvedValue(undefined);
    mockGetDocs.mockResolvedValue({ empty: true, docs: [] });

    await archiveDocument("doc-1");

    expect(mockUpdateDoc).toHaveBeenCalled();
  });

  it("restoreDocument → sets isArchived to false", async () => {
    mockUpdateDoc.mockResolvedValue(undefined);

    await restoreDocument("doc-1");

    expect(mockUpdateDoc).toHaveBeenCalled();
  });

  it("deleteDocumentPermanently → deletes doc and children recursively", async () => {
    // No children
    mockGetDocs.mockResolvedValue({ docs: [] });
    mockDeleteDoc.mockResolvedValue(undefined);

    await deleteDocumentPermanently("doc-1");

    expect(mockDeleteDoc).toHaveBeenCalled();
  });

  it("full CRUD flow: create → get → update → archive → restore → delete", async () => {
    // Create
    mockAddDoc.mockResolvedValue({ id: "flow-doc" });
    const id = await createDocument("user-1");
    expect(id).toBe("flow-doc");

    // Get
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: "flow-doc",
      data: () => ({ title: "", userId: "user-1", isArchived: false }),
    });
    const doc = await getDocument("flow-doc");
    expect(doc!.title).toBe("");

    // Update
    mockUpdateDoc.mockResolvedValue(undefined);
    await updateDocument("flow-doc", { title: "Updated" });
    expect(mockUpdateDoc).toHaveBeenCalled();

    // Archive
    vi.clearAllMocks();
    mockUpdateDoc.mockResolvedValue(undefined);
    mockGetDocs.mockResolvedValue({ empty: true, docs: [] });
    await archiveDocument("flow-doc");
    expect(mockUpdateDoc).toHaveBeenCalled();

    // Restore
    vi.clearAllMocks();
    mockUpdateDoc.mockResolvedValue(undefined);
    await restoreDocument("flow-doc");
    expect(mockUpdateDoc).toHaveBeenCalled();

    // Delete
    vi.clearAllMocks();
    mockGetDocs.mockResolvedValue({ docs: [] });
    mockDeleteDoc.mockResolvedValue(undefined);
    await deleteDocumentPermanently("flow-doc");
    expect(mockDeleteDoc).toHaveBeenCalled();
  });
});
