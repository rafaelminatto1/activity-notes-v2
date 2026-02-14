/**
 * Ícone disponível para seleção
 */
export interface DocumentIcon {
  id: string;
  emoji: string;
  category: string;
}

/**
 * Categoria de ícones para organização
 */
export interface IconCategory {
  id: string;
  name: string;
  icons: DocumentIcon[];
  category?: string;
}

/**
 * Dados de ícones e cores recentemente usados
 */
export interface IconHistory {
  recentIcons: string[];
  recentColors: string[];
}
