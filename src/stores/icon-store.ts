import { create } from 'zustand';
import type { DocumentIcon, IconCategory, IconHistory } from '@/types/icon';

/**
 * Catálogo de ícones organizados por categorias
 */
export const ICON_CATEGORIES: IconCategory[] = [
  {
    id: 'work',
    name: 'Trabalho',
    category: 'work',
    icons: [
      { id: 'briefcase', emoji: '💼', category: 'work' },
      { id: 'file-text', emoji: '📄', category: 'work' },
      { id: 'calendar', emoji: '📅', category: 'work' },
      { id: 'chart-bar', emoji: '📊', category: 'work' },
      { id: 'building', emoji: '🏢', category: 'work' },
    ]
  },
  {
    id: 'personal',
    name: 'Pessoal',
    category: 'personal',
    icons: [
      { id: 'user', emoji: '👤', category: 'personal' },
      { id: 'heart', emoji: '❤️', category: 'personal' },
      { id: 'star', emoji: '⭐', category: 'personal' },
      { id: 'camera', emoji: '📷', category: 'personal' },
    ]
  },
  {
    id: 'studies',
    name: 'Estudos',
    category: 'studies',
    icons: [
      { id: 'book', emoji: '📚', category: 'studies' },
      { id: 'graduation-cap', emoji: '🎓', category: 'studies' },
      { id: 'pencil', emoji: '✏️', category: 'studies' },
      { id: 'lightbulb', emoji: '💡', category: 'studies' },
      { id: 'brain', emoji: '🧠', category: 'studies' },
    ]
  },
  {
    id: 'home',
    name: 'Casa',
    category: 'home',
    icons: [
      { id: 'home', emoji: '🏠', category: 'home' },
      { id: 'utensils', emoji: '🍽️', category: 'home' },
      { id: 'coffee', emoji: '☕', category: 'home' },
      { id: 'plant', emoji: '🌱', category: 'home' },
    ]
  },
  {
    id: 'travel',
    name: 'Viagem',
    category: 'travel',
    icons: [
      { id: 'plane', emoji: '✈️', category: 'travel' },
      { id: 'map', emoji: '🗺️', category: 'travel' },
      { id: 'suitcase', emoji: '🧳', category: 'travel' },
      { id: 'camera-retro', emoji: '📸', category: 'travel' },
    ]
  },
  {
    id: 'finance',
    name: 'Finanças',
    category: 'finance',
    icons: [
      { id: 'dollar', emoji: '💵', category: 'finance' },
      { id: 'credit-card', emoji: '💳', category: 'finance' },
      { id: 'wallet', emoji: '👛', category: 'finance' },
      { id: 'calculator', emoji: '🧮', category: 'finance' },
    ]
  },
  {
    id: 'health',
    name: 'Saúde',
    category: 'health',
    icons: [
      { id: 'heart-pulse', emoji: '❤️‍🔥', category: 'health' },
      { id: 'pill', emoji: '💊', category: 'health' },
      { id: 'stethoscope', emoji: '🩺', category: 'health' },
      { id: 'cross', emoji: '✝️', category: 'health' },
    ]
  },
];

/**
 * Paleta de cores organizada por tipo
 */
export const COLOR_PALETTE = [
  // Cores Profissionais (Neutras)
  { id: 'gray-100', name: 'Cinza claro', hex: '#f3f4f6' },
  { id: 'gray-200', name: 'Cinza médio', hex: '#e5e7eb' },
  { id: 'gray-300', name: 'Cinza escuro', hex: '#d1d5db' },

  // Cores Vibrantes
  { id: 'red-500', name: 'Vermelho', hex: '#ef4444' },
  { id: 'orange-500', name: 'Laranja', hex: '#f97316' },
  { id: 'yellow-500', name: 'Amarelo', hex: '#eab308' },
  { id: 'green-500', name: 'Verde', hex: '#22c55e' },
  { id: 'blue-500', name: 'Azul', hex: '#3b82f6' },
  { id: 'purple-500', name: 'Roxo', hex: '#a855f7' },
  { id: 'pink-500', name: 'Rosa', hex: '#ec4899' },

  // Cores Pastéis
  { id: 'red-200', name: 'Vermelho pastel', hex: '#fecaca' },
  { id: 'orange-200', name: 'Laranja pastel', hex: '#fed7aa' },
  { id: 'yellow-200', name: 'Amarelo pastel', hex: '#fef08a' },
  { id: 'green-200', name: 'Verde pastel', hex: '#bbf7d0' },
  { id: 'blue-200', name: 'Azul pastel', hex: '#bfdbfe' },
  { id: 'purple-200', name: 'Roxo pastel', hex: '#e9d5ff' },
  { id: 'pink-200', name: 'Rosa pastel', hex: '#fbcfe8' },
];

/**
 * Histórico de ícones e cores recentes
 */
const DEFAULT_HISTORY: IconHistory = {
  recentIcons: [],
  recentColors: [],
};

/**
 * Store para gerenciamento de ícones e cores
 */
interface IconStore {
  // Estado
  iconCategories: IconCategory[];
  selectedIcon: string | null;
  selectedColor: string | null;
  recentIcons: string[];
  recentColors: string[];

  // Ações
  setSelectedIcon: (icon: string | null) => void;
  setSelectedColor: (color: string | null) => void;
  addRecentIcon: (icon: string) => void;
  addRecentColor: (color: string) => void;
  clearHistory: () => void;
}

/**
 * Função para carregar histórico do localStorage
 */
function loadHistory(): IconHistory {
  try {
    const saved = localStorage.getItem('iconHistory');
    if (saved) {
      return JSON.parse(saved) as IconHistory;
    }
    return DEFAULT_HISTORY;
  } catch {
    return DEFAULT_HISTORY;
  }
}

/**
 * Função para salvar histórico no localStorage
 */
function saveHistory(history: IconHistory): void {
  try {
    localStorage.setItem('iconHistory', JSON.stringify(history));
  } catch (error) {
    console.error('Erro ao salvar histórico de ícones:', error);
  }
}

export const useIconStore = create<IconStore>((set, get) => {
  // Carregar histórico do localStorage
  const history = loadHistory();

  return {
    // Estado inicial
    iconCategories: ICON_CATEGORIES,
    selectedIcon: null,
    selectedColor: null,
    recentIcons: history.recentIcons,
    recentColors: history.recentColors,

    // Ações
    setSelectedIcon: (icon) => {
      set({ selectedIcon: icon });
    },

    setSelectedColor: (color) => {
      set({ selectedColor: color });
    },

    addRecentIcon: (icon) => {
      set((state) => {
        const filtered = state.recentIcons.filter((i) => i !== icon);
        const updated = [icon, ...filtered].slice(0, 20); // Manter últimos 20
        const newHistory: IconHistory = { ...get(), recentIcons: updated };
        saveHistory(newHistory);
        return { recentIcons: updated };
      });
    },

    addRecentColor: (color) => {
      set((state) => {
        const filtered = state.recentColors.filter((c) => c !== color);
        const updated = [color, ...filtered].slice(0, 10); // Manter últimos 10
        const newHistory: IconHistory = { ...get(), recentColors: updated };
        saveHistory(newHistory);
        return { recentColors: updated };
      });
    },

    clearHistory: () => {
      set({ recentIcons: [], recentColors: [] });
      saveHistory(DEFAULT_HISTORY);
    },
  };
});
