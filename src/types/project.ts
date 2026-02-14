import type { Timestamp } from "firebase/firestore";

/**
 * Modelo de Projetos/Pastas
 * Permite agrupar documentos em categorias temáticas
 */
export interface Project {
  id: string;
  name: string;
  icon: string; // Ícone do projeto (emoji)
  color: string; // Cor do projeto (hex)
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  documentCount?: number; // Opcional: cache de contagem
}

/**
 * Dados para criar um novo projeto
 */
export interface ProjectCreate {
  name: string;
  icon: string;
  color: string;
  userId?: string;
}

/**
 * Dados para atualizar um projeto existente
 */
export interface ProjectUpdate {
  name?: string;
  icon?: string;
  color?: string;
}
