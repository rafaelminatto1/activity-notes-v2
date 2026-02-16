export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  avatarUrl: string;
  settings: UserSettings;
  favoriteIds: string[];
  recentDocIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
  aiEnabled: boolean;
  aiLanguage: string;
}
