"use client";

import React, { useState, useEffect } from "react";
import { 
  Key, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  ShieldAlert,
  ArrowLeft,
  Clock
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { getApiKeys, createApiKey, deleteApiKey, ApiKey } from "@/lib/firebase/api-keys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ApiSettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadKeys();
    }
  }, [user]);

  const loadKeys = async () => {
    if (!user) return;
    try {
      const data = await getApiKeys(user.uid);
      setKeys(data);
    } catch (error) {
      toast.error("Erro ao carregar chaves");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!user || !newName.trim()) return;
    setIsCreating(true);
    try {
      const key = await createApiKey(user.uid, newName);
      setNewlyCreatedKey(key);
      setNewName("");
      loadKeys();
      toast.success("Chave gerada!");
    } catch (error) {
      toast.error("Erro ao gerar chave");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja revogar esta chave? Aplicações que a utilizam perderão o acesso.")) return;
    try {
      await deleteApiKey(id);
      setKeys(keys.filter(k => k.id !== id));
      toast.success("Chave revogada");
    } catch (error) {
      toast.error("Erro ao revogar chave");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/settings")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Key className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">API Pública</h1>
        </div>
      </div>

      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/50">
        <CardContent className="p-4 flex gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-400">
            Suas chaves de API concedem acesso total aos seus dados. Nunca compartilhe suas chaves ou as envie para o GitHub.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex gap-2">
          <Input 
            placeholder="Nome da chave (ex: Integração Python, Zapier...)" 
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            disabled={isCreating}
          />
          <Button onClick={handleCreate} disabled={!newName.trim() || isCreating}>
            <Plus className="h-4 w-4 mr-2" /> Gerar Chave
          </Button>
        </div>

        {newlyCreatedKey && (
          <Card className="border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20">
            <CardHeader className="py-3">
              <CardTitle className="text-sm text-emerald-700 dark:text-emerald-400">Nova Chave Gerada</CardTitle>
              <CardDescription>Copie agora, ela não será exibida novamente por segurança.</CardDescription>
            </CardHeader>
            <CardContent className="py-2 flex gap-2">
              <code className="flex-1 bg-background p-2 rounded border border-emerald-200 font-mono text-xs overflow-x-auto">
                {newlyCreatedKey}
              </code>
              <Button size="icon" onClick={() => copyToClipboard(newlyCreatedKey)}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setNewlyCreatedKey(null)}>
                <Check className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">Suas Chaves</h2>
          {keys.length === 0 && !loading ? (
            <div className="text-center py-12 border-2 border-dashed rounded-xl opacity-50">
              <p className="text-sm">Você ainda não tem chaves de API.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {keys.map((key) => (
                <Card key={key.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-bold">{key.name}</div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Criada em: {format(key.createdAt.toDate(), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                        {key.lastUsedAt && (
                          <span className="flex items-center gap-1 text-emerald-600">
                            <Check className="h-3 w-3" />
                            Último uso: {format(key.lastUsedAt.toDate(), "dd/MM HH:mm", { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(key.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
