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
  userId: string;
}

export type ProjectUpdate = Partial<ProjectCreate>;

/**
 * Sprint status
 */
export type SprintStatus = "planned" | "active" | "completed";

/**
 * Sprint Management
 */
export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  goal: string;
  startDate: Timestamp;
  endDate: Timestamp;
  status: SprintStatus;
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
}

/**
 * Sprint create data
 */
export type SprintCreate = Omit<Sprint, "id" | "createdAt" | "updatedAt">;


