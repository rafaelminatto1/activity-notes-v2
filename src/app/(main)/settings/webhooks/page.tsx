"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Globe, 
  Plus, 
  Trash2, 
  History,
  Activity,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ChevronRight,
  RotateCcw
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { 
  getWebhooks, 
  createWebhook, 
  deleteWebhook, 
  getWebhookLogs, 
  resendWebhook,
  Webhook, 
  WebhookLog, 
  WebhookEvent 
} from "@/lib/firebase/webhooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const AVAILABLE_EVENTS: { id: WebhookEvent; label: string }[] = [
  { id: "task.created", label: "Tarefa Criada" },
  { id: "task.updated", label: "Tarefa Atualizada" },
  { id: "task.deleted", label: "Tarefa Excluída" },
  { id: "document.created", label: "Documento Criado" },
  { id: "document.updated", label: "Documento Atualizado" },
  { id: "document.deleted", label: "Documento Excluído" },
];

export default function WebhooksSettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [logsModalWebhookId, setLogsModalWebhookId] = useState<string | null>(null);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const [newWebhook, setNewWebhook] = useState({
    url: "",
    events: [] as WebhookEvent[]
  });

  const loadWebhooks = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getWebhooks(user.uid);
      setWebhooks(data);
    } catch {
      toast.error("Erro ao carregar webhooks");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadWebhooks();
  }, [loadWebhooks]);

  const handleCreate = async () => {
    if (!user || !newWebhook.url.trim() || newWebhook.events.length === 0) {
      toast.error("Preencha a URL e selecione ao menos um evento.");
      return;
    }
    
    try {
      await createWebhook(user.uid, newWebhook);
      setNewWebhook({ url: "", events: [] });
      setIsModalOpen(false);
      await loadWebhooks();
      toast.success("Webhook adicionado!");
    } catch {
      toast.error("Erro ao salvar webhook");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover este webhook?")) return;
    try {
      await deleteWebhook(id);
      setWebhooks(webhooks.filter(w => w.id !== id));
      toast.success("Webhook removido");
    } catch {
      toast.error("Erro ao remover webhook");
    }
  };

  const loadLogs = async (webhookId: string) => {
    setLogsModalWebhookId(webhookId);
    setLogsLoading(true);
    try {
      const data = await getWebhookLogs(webhookId);
      setLogs(data);
    } catch {
      toast.error("Erro ao carregar logs");
    } finally {
      setLogsLoading(false);
    }
  };

  const toggleEvent = (event: WebhookEvent) => {
    setNewWebhook(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event]
    }));
  };

  const handleResend = async (log: WebhookLog) => {
    try {
      const success = await resendWebhook(log);
      if (success) {
        toast.success("Evento reenviado!");
        if (logsModalWebhookId) loadLogs(logsModalWebhookId);
      } else {
        toast.error("Falha ao reenviar.");
      }
    } catch {
      toast.error("Erro no reenvio.");
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/settings")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Webhooks</h1>
          </div>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Adicionar Endpoint
        </Button>
      </div>

      <div className="space-y-4">
        {webhooks.length === 0 && !loading ? (
          <div className="text-center py-20 border-2 border-dashed rounded-2xl opacity-50 flex flex-col items-center gap-4">
            <Activity className="h-12 w-12 text-muted-foreground" />
            <p className="text-sm">Nenhum webhook configurado. Use webhooks para integrar com Slack, Discord ou seu próprio servidor.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {webhooks.map((webhook) => (
              <Card key={webhook.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="font-mono text-xs font-bold text-primary truncate">{webhook.url}</div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {webhook.events.map(e => (
                          <span key={e} className="text-[9px] bg-muted px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">
                            {e}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" title="Ver logs" onClick={() => loadLogs(webhook.id)}>
                        <History className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(webhook.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* New Webhook Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Webhook</DialogTitle>
            <DialogDescription>
              Enviaremos um POST JSON para esta URL sempre que os eventos selecionados ocorrerem.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>URL de Destino</Label>
              <Input 
                placeholder="https://sua-api.com/webhook" 
                value={newWebhook.url}
                onChange={(e) => setNewWebhook({...newWebhook, url: e.target.value})}
              />
            </div>
            <div className="space-y-3">
              <Label>Eventos para assinar</Label>
              <div className="grid grid-cols-1 gap-2 border p-3 rounded-lg bg-muted/10">
                {AVAILABLE_EVENTS.map(event => (
                  <div key={event.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={event.id} 
                      checked={newWebhook.events.includes(event.id)}
                      onCheckedChange={() => toggleEvent(event.id)}
                    />
                    <label htmlFor={event.id} className="text-sm font-medium leading-none cursor-pointer">
                      {event.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate}>Salvar Webhook</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logs Modal */}
      <Dialog open={!!logsModalWebhookId} onOpenChange={(open) => !open && setLogsModalWebhookId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Logs de Entrega</DialogTitle>
            <DialogDescription>Últimas 50 tentativas de entrega nos últimos 7 dias.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto pr-2 space-y-2">
            {logsLoading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">Carregando logs...</div>
            ) : logs.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">Nenhuma entrega registrada.</div>
            ) : (
              logs.map(log => (
                <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/5 group">
                  {log.status >= 200 && log.status < 300 ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">
                        {log.event} {log.is_resend && "(Reenvio)"}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">Status: {log.status}</span>
                    </div>
                    <div className="text-xs truncate font-medium mt-0.5">{format(log.createdAt.toDate(), "dd/MM HH:mm:ss", { locale: ptBR })}</div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleResend(log)}>
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
