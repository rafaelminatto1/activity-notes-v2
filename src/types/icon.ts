export interface DocumentIcon {
  id: string;
  emoji: string;
  label?: string;
  category: IconCategory;
}

export type IconCategory =
  | 'work'
  | 'personal'
  | 'study'
  | 'finance'
  | 'travel'
  | 'health'
  | 'home'
  | 'other';

export interface IconCategoryData {
  id: IconCategory;
  name: string;
  icons: DocumentIcon[];
}

export interface DocumentColor {
  id: string;
  name: string;
  hex: string;
  category: 'neutral' | 'vibrant' | 'pastel';
}

export interface IconHistory {
  recentIcons: string[];
  recentColors: string[];
}
