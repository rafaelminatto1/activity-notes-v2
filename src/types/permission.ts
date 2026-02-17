export type ResourceType = "tasks" | "documents" | "projects" | "settings" | "automations" | "goals";

export type PermissionAction = "create" | "read" | "update" | "delete" | "manage" | "share";

export interface RolePermissions {
  tasks: PermissionAction[];
  documents: PermissionAction[];
  projects: PermissionAction[];
  settings: PermissionAction[];
  automations: PermissionAction[];
  goals: PermissionAction[];
}

export interface WorkspaceRole {
  id: string;
  name: string;
  description: string;
  permissions: RolePermissions;
  isSystem?: boolean; // Default roles like Admin, Editor, Viewer
}

export interface WorkspaceMember {
  uid: string;
  email: string;
  roleId: string;
  joinedAt: any;
}

export const DEFAULT_ROLES: Record<string, WorkspaceRole> = {
  admin: {
    id: "admin",
    name: "Administrador",
    description: "Acesso total ao workspace e configurações.",
    isSystem: true,
    permissions: {
      tasks: ["create", "read", "update", "delete", "manage", "share"],
      documents: ["create", "read", "update", "delete", "manage", "share"],
      projects: ["create", "read", "update", "delete", "manage", "share"],
      settings: ["create", "read", "update", "delete", "manage", "share"],
      automations: ["create", "read", "update", "delete", "manage", "share"],
      goals: ["create", "read", "update", "delete", "manage", "share"],
    },
  },
  editor: {
    id: "editor",
    name: "Editor",
    description: "Pode criar e editar conteúdo, mas não gerenciar membros.",
    isSystem: true,
    permissions: {
      tasks: ["create", "read", "update", "delete"],
      documents: ["create", "read", "update", "delete", "share"],
      projects: ["read", "update"],
      settings: ["read"],
      automations: ["read"],
      goals: ["create", "read", "update"],
    },
  },
  viewer: {
    id: "viewer",
    name: "Visualizador",
    description: "Acesso apenas leitura.",
    isSystem: true,
    permissions: {
      tasks: ["read"],
      documents: ["read"],
      projects: ["read"],
      settings: ["read"],
      automations: ["read"],
      goals: ["read"],
    },
  },
};
