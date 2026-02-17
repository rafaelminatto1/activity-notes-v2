"use client";

import { useState } from "react";
import { 
  Zap, 
  Plus, 
  Trash2, 
  Play, 
  Settings2, 
  ChevronRight,
  ArrowRight,
  Bell,
  UserPlus,
  CheckCircle2,
  Tag as TagIcon,
  MessageSquare,
  PlusCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Automation, AutomationAction, TriggerType, ActionType } from "@/types/automation";
import { cn } from "@/lib/utils";

interface AutomationBuilderProps {
  onSave: (automation: Partial<Automation>) => void;
  onCancel: () => void;
}

const TRIGGER_OPTIONS: { value: TriggerType; label: string; icon: any }[] = [
  { value: "task_created", label: "Tarefa criada", icon: PlusCircle },
  { value: "status_changed", label: "Status alterado", icon: CheckCircle2 },
  { value: "priority_changed", label: "Prioridade alterada", icon: Zap },
  { value: "assignee_changed", label: "Responsável alterado", icon: UserPlus },
  { value: "comment_added", label: "Comentário adicionado", icon: MessageSquare },
];

const ACTION_OPTIONS: { value: ActionType; label: string; icon: any }[] = [
  { value: "update_status", label: "Mudar status", icon: CheckCircle2 },
  { value: "assign_to", label: "Atribuir a alguém", icon: UserPlus },
  { value: "add_comment", label: "Adicionar comentário", icon: MessageSquare },
  { value: "send_notification", label: "Enviar notificação", icon: Bell },
  { value: "add_tag", label: "Adicionar tag", icon: TagIcon },
];

export function AutomationBuilder({ onSave, onCancel }: AutomationBuilderProps) {
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState<TriggerType>("status_changed");
  const [actions, setActions] = useState<AutomationAction[]>([]);

  const addAction = () => {
    const newAction: AutomationAction = {
      id: Math.random().toString(36).substring(7),
      type: "update_status",
      config: {},
    };
    setActions([...actions, newAction]);
  };

  const removeAction = (id: string) => {
    setActions(actions.filter((a) => a.id !== id));
  };

  const updateAction = (id: string, updates: Partial<AutomationAction>) => {
    setActions(actions.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-black flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary fill-primary/20" />
            Nova Automação
          </h2>
          <p className="text-muted-foreground">Configure gatilhos e ações automáticas.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onCancel} className="font-bold">Cancelar</Button>
          <Button 
            onClick={() => onSave({ name, trigger: { type: trigger, config: {} }, actions })}
            disabled={!name || actions.length === 0}
            className="font-bold gap-2 px-6 rounded-xl shadow-lg shadow-primary/20"
          >
            Salvar Regra
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nome da Automação</label>
          <Input 
            placeholder="Ex: Mover para Revisão quando concluído" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 text-lg font-medium rounded-xl border-2 focus-visible:ring-primary/20"
          />
        </div>

        {/* TRIGGER */}
        <div className="relative">
          <div className="absolute left-6 -top-3 px-2 bg-background z-10 text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Quando isto acontecer
          </div>
          <div className="p-8 rounded-2xl border-2 border-primary/20 bg-primary/5 space-y-4">
            <Select value={trigger} onValueChange={(v: TriggerType) => setTrigger(v)}>
              <SelectTrigger className="h-12 rounded-xl bg-background border-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRIGGER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex items-center gap-2">
                      <opt.icon className="w-4 h-4 text-primary" />
                      {opt.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="w-px h-8 bg-gradient-to-b from-primary/50 to-transparent" />
        </div>

        {/* ACTIONS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
              Então execute estas ações
            </div>
            <Button variant="ghost" size="sm" onClick={addAction} className="text-primary font-bold gap-1 text-xs">
              <Plus className="w-3.5 h-3.5" />
              Adicionar Ação
            </Button>
          </div>

          <div className="space-y-3">
            {actions.map((action, index) => (
              <div key={action.id} className="group relative animate-in zoom-in-95 duration-200">
                <div className="p-6 rounded-2xl border bg-card/50 hover:border-primary/30 transition-all flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                    {index + 1}
                  </div>
                  
                  <Select 
                    value={action.type} 
                    onValueChange={(v: ActionType) => action.id && updateAction(action.id, { type: v, config: {} })}
                  >
                    <SelectTrigger className="w-64 bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTION_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <opt.icon className="w-4 h-4" />
                            {opt.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {action.type === "update_status" && (
                    <Select 
                      value={action.config.value} 
                      onValueChange={(v) => action.id && updateAction(action.id, { config: { value: v } })}
                    >
                      <SelectTrigger className="flex-1 bg-background">
                        <SelectValue placeholder="Escolha o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">Pendente</SelectItem>
                        <SelectItem value="in_progress">Em Progresso</SelectItem>
                        <SelectItem value="done">Concluído</SelectItem>
                      </SelectContent>
                    </Select>
                  )}

                  {action.type === "update_priority" && (
                    <Select 
                      value={action.config.value} 
                      onValueChange={(v) => action.id && updateAction(action.id, { config: { value: v } })}
                    >
                      <SelectTrigger className="flex-1 bg-background">
                        <SelectValue placeholder="Escolha a prioridade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  )}

                  {action.type === "add_comment" && (
                    <Input 
                      placeholder="Texto do comentário..." 
                      className="flex-1 bg-background"
                      value={action.config.value || ""}
                      onChange={(e) => action.id && updateAction(action.id, { config: { value: e.target.value } })}
                    />
                  )}

                  {action.type === "send_notification" && (
                    <Input 
                      placeholder="Mensagem da notificação..." 
                      className="flex-1 bg-background"
                      value={action.config.value || ""}
                      onChange={(e) => action.id && updateAction(action.id, { config: { value: e.target.value } })}
                    />
                  )}

                  {["assign_to", "add_tag"].includes(action.type) && (
                    <Input 
                      placeholder="Valor..." 
                      className="flex-1 bg-background"
                      value={action.config.value || ""}
                      onChange={(e) => action.id && updateAction(action.id, { config: { value: e.target.value } })}
                    />
                  )}

                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => action.id && removeAction(action.id)}
                    className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            {actions.length === 0 && (
              <button 
                onClick={addAction}
                className="w-full py-8 rounded-2xl border-2 border-dashed border-muted hover:border-primary/20 hover:bg-primary/5 transition-all text-muted-foreground font-medium flex flex-col items-center gap-2"
              >
                <PlusCircle className="w-8 h-8 opacity-20" />
                Nenhuma ação configurada. Clique para adicionar.
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
