"use client";

import { useState } from "react";
import { 
  Shield, 
  ChevronRight, 
  Plus, 
  Check, 
  X,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ResourceType, 
  PermissionAction, 
  DEFAULT_ROLES,
  WorkspaceRole
} from "@/types/permission";
import { cn } from "@/lib/utils";

const RESOURCES: { id: ResourceType; label: string }[] = [
  { id: "documents", label: "Documentos" },
  { id: "tasks", label: "Tarefas" },
  { id: "projects", label: "Projetos" },
  { id: "goals", label: "Metas" },
  { id: "automations", label: "Automações" },
  { id: "settings", label: "Configurações" },
];

const ACTIONS: { id: PermissionAction; label: string }[] = [
  { id: "read", label: "Visualizar" },
  { id: "create", label: "Criar" },
  { id: "update", label: "Editar" },
  { id: "delete", label: "Excluir" },
  { id: "share", label: "Compartilhar" },
  { id: "manage", label: "Gerenciar" },
];

export default function RolesSettingsPage() {
  const [activeRole, setActiveRole] = useState<WorkspaceRole>(DEFAULT_ROLES.admin);

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto p-8 space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
            <Shield className="w-10 h-10 text-primary" />
            Funções e Permissões
          </h1>
          <p className="text-muted-foreground text-lg">
            Gerencie o acesso e as capacidades dos membros no workspace.
          </p>
        </div>
        <Button className="h-12 px-6 rounded-xl font-bold gap-2 shadow-lg shadow-primary/20">
          <Plus className="w-5 h-5" />
          Nova Função
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Role List */}
        <div className="lg:col-span-1 space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-4 mb-4">
            Funções Disponíveis
          </p>
          {Object.values(DEFAULT_ROLES).map((role) => (
            <button
              key={role.id}
              onClick={() => setActiveRole(role)}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-xl text-left transition-all group",
                activeRole.id === role.id 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "bg-muted/50 hover:bg-muted text-foreground"
              )}
            >
              <div className="min-w-0">
                <p className="font-bold text-sm truncate">{role.name}</p>
                {role.isSystem && (
                  <span className={cn(
                    "text-[8px] font-black uppercase tracking-wider",
                    activeRole.id === role.id ? "text-primary-foreground/60" : "text-muted-foreground"
                  )}>
                    Sistema
                  </span>
                )}
              </div>
              <ChevronRight className={cn(
                "w-4 h-4 transition-transform",
                activeRole.id === role.id ? "translate-x-1" : "opacity-0 group-hover:opacity-100"
              )} />
            </button>
          ))}
        </div>

        {/* Permissions Grid */}
        <div className="lg:col-span-3">
          <div className="bg-card border-2 rounded-3xl overflow-hidden shadow-xl shadow-primary/5">
            <div className="p-8 border-b bg-muted/30">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-black tracking-tight">{activeRole.name}</h2>
                {activeRole.isSystem && (
                  <Badge variant="outline" className="font-bold uppercase tracking-widest text-[10px]">
                    Somente Leitura (Sistema)
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">{activeRole.description}</p>
            </div>

            <div className="p-8 space-y-8">
              {RESOURCES.map((resource) => (
                <div key={resource.id} className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-[0.1em] text-foreground flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {resource.label}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {ACTIONS.map((action) => {
                      const isAllowed = activeRole.permissions[resource.id]?.includes(action.id);
                      const isAdmin = activeRole.id === "admin";

                      return (
                        <div 
                          key={action.id}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-xl border transition-all",
                            (isAllowed || isAdmin) ? "bg-primary/5 border-primary/20" : "bg-muted/20 border-transparent opacity-40"
                          )}
                        >
                          <span className="text-xs font-medium">{action.label}</span>
                          {(isAllowed || isAdmin) ? (
                            <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                              <Check className="w-3 h-3" />
                            </div>
                          ) : (
                            <X className="w-3 h-3 text-muted-foreground" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {!activeRole.isSystem && (
              <div className="p-8 bg-muted/10 border-t flex justify-end gap-4">
                <Button variant="ghost" className="font-bold text-destructive hover:text-destructive">
                  Excluir Função
                </Button>
                <Button className="px-8 rounded-xl font-bold shadow-lg shadow-primary/20">
                  Salvar Alterações
                </Button>
              </div>
            )}
          </div>

          <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-3 text-sm text-amber-700 dark:text-amber-400">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>
              Alterações nas permissões afetam todos os usuários com esta função imediatamente. 
              As funções de sistema (Admin, Editor, Visualizador) não podem ser modificadas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
