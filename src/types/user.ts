import { Timestamp } from "firebase/firestore";

export interface UserSettings {
  theme: "light" | "dark" | "system";
  colorPalette: "default" | "ocean" | "forest" | "sunset" | "lavender" | "midnight";
  density: "compact" | "normal" | "comfortable";
  editorFont: "sans" | "serif" | "mono";
  defaultView: "list" | "grid";
  fontSize: "small" | "medium" | "large";
  contentWidth: "narrow" | "medium" | "wide";
  aiEnabled: boolean;
  aiPreferredModel: "flash" | "pro";
  aiResponseLanguage: string;
}

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  avatarUrl: string;
  plan: "free" | "pro";
  settings: UserSettings;
  favoriteIds: string[];
  favoriteTemplateIds: string[];
  recentDocIds: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type UserProfileUpdate = Partial<
  Omit<UserProfile, "id" | "email" | "createdAt">
>;
