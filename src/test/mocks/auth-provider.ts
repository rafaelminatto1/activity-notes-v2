import type { UserProfile } from "@/types/user";
import { Timestamp } from "firebase/firestore";

export const mockUser = {
  uid: "test-user-123",
  email: "test@example.com",
  displayName: "Test User",
  photoURL: null,
  emailVerified: true,
  isAnonymous: false,
  providerData: [],
  getIdToken: vi.fn().mockResolvedValue("mock-token"),
} as unknown as import("firebase/auth").User;

export const mockUserProfile: UserProfile = {
  id: "test-user-123",
  displayName: "Test User",
  email: "test@example.com",
  avatarUrl: "",
  plan: "free",
  settings: {
    theme: "system",
    defaultView: "list",
    fontSize: "medium",
    contentWidth: "medium",
    aiEnabled: true,
    aiPreferredModel: "flash",
    aiResponseLanguage: "pt-BR",
  },
  favoriteIds: [],
  recentDocIds: ["doc-1", "doc-2"],
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
};

export function mockAuthContext(overrides: Record<string, unknown> = {}) {
  return {
    user: mockUser,
    userProfile: mockUserProfile,
    loading: false,
    error: null,
    isAuthenticated: true,
    refreshProfile: vi.fn(),
    ...overrides,
  };
}
