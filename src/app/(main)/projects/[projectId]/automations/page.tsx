"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { 
  subscribeToAutomations, 
  createAutomation, 
  updateAutomation, 
  deleteAutomation 
} from "@/lib/firebase/automations";
import { Automation } from "@/types/automation";
import { AutomationBuilder } from "@/components/automations/automation-builder";
import { AutomationLogView } from "@/components/automations/automation-log";
import { Button } from "@/components/ui/button";
import { 
  Zap, 
  Plus, 
  Settings2, 
  Trash2, 
  Power, 
  Activity,
  Boxes,
  Workflow
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ProjectAutomationsPage() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (projectId) {
      return subscribeToAutomations(projectId as string, (data) => {
        setAutomations(data);
        setIsLoading(false);
      });
    }
  }, [projectId]);

  const handleSaveAutomation = async (data: Partial<Automation>) => {
    if (!user || !projectId) return;
    try {
      await createAutomation(user.uid, projectId as string, data);
      setIsCreating(false);
      toast.success("Automação criada!");
    } catch (error) {
      toast.error("Erro ao criar automação");
    }
  };

  const toggleStatus = async (id: string, current: boolean) => {
    try {
      await updateAutomation(id, { active: !current });
      toast.success(current ? "Automação pausada" : "Automação ativada");
    } catch (error) {
      toast.error("Erro ao atualizar status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Deseja excluir esta automação?")) return;
    try {
      await deleteAutomation(id);
      toast.success("Automação excluída");
    } catch (error) {
      toast.error("Erro ao excluir");
    }
  };

  if (isLoading) {
    return <div className="p-8 space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto p-8 space-y-10">
      {!isCreating ? (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
                <Workflow className="w-10 h-10 text-primary" />
                Workflow & Automações
              </h1>
              <p className="text-muted-foreground text-lg">
                Otimize seu fluxo de trabalho com regras inteligentes.
              </p>
            </div>
            <Button 
              onClick={() => setIsCreating(true)} 
              className="h-12 px-6 rounded-xl font-bold gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Plus className="w-5 h-5" />
              Nova Regra
            </Button>
          </div>

          <Tabs defaultValue="rules" className="w-full">
            <TabsList className="h-12 p-1 bg-muted/50 rounded-xl mb-8">
              <TabsTrigger value="rules" className="rounded-lg px-8 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Regras Ativas
              </TabsTrigger>
              <TabsTrigger value="logs" className="rounded-lg px-8 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Logs de Execução
              </TabsTrigger>
            </TabsList>

            <TabsContent value="rules" className="space-y-4">
              {automations.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl bg-muted/20">
                  <Boxes className="w-16 h-16 text-muted-foreground/30 mb-4" />
                  <h3 className="text-xl font-bold text-muted-foreground">Nenhuma automação configurada</h3>
                  <p className="text-muted-foreground mb-6">Comece criando sua primeira regra de workflow.</p>
                  <Button variant="outline" onClick={() => setIsCreating(true)}>Criar Automação</Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {automations.map((auto) => (
                    <div key={auto.id} className={cn(
                      "group p-6 rounded-2xl border-2 transition-all flex items-center justify-between",
                      auto.active ? "bg-card border-transparent hover:border-primary/20" : "bg-muted/30 border-dashed opacity-60"
                    )}>
                      <div className="flex items-center gap-6">
                        <div className={cn(
                          "p-4 rounded-xl",
                          auto.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        )}>
                          <Zap className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-bold text-lg">{auto.name}</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wider">
                            <span>{auto.trigger.type.replace('_', ' ')}</span>
                            <ArrowRight className="w-3 h-3" />
                            <span>{auto.actions.length} ações</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => toggleStatus(auto.id, auto.active)}
                          className={cn("rounded-full", auto.active ? "text-green-600 hover:text-green-700" : "text-muted-foreground")}
                        >
                          <Power className="w-5 h-5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(auto.id)}
                          className="rounded-full text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="logs">
              <AutomationLogView projectId={projectId as string} />
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <AutomationBuilder 
          onSave={handleSaveAutomation}
          onCancel={() => setIsCreating(false)}
        />
      )}
    </div>
  );
}

function ArrowRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
