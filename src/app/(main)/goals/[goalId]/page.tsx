"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getGoal, updateGoal } from "@/lib/firebase/goals";
import { Goal, KeyResult } from "@/types/goal";
import { KeyResultItem } from "@/components/goals/key-result-item";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { 
  ArrowLeft, 
  Plus, 
  Target, 
  Calendar, 
  User, 
  MoreHorizontal,
  PlusCircle,
  Trophy,
  PieChart
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function GoalDetailPage() {
  const { goalId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (goalId) {
      loadGoal();
    }
  }, [goalId]);

  async function loadGoal() {
    try {
      const data = await getGoal(goalId as string);
      setGoal(data);
    } catch (error) {
      toast.error("Erro ao carregar meta");
    } finally {
      setIsLoading(false);
    }
  }

  const handleAddKeyResult = async () => {
    if (!goal) return;
    const title = window.prompt("Título do Resultado-Chave:");
    if (!title) return;

    const newKR: KeyResult = {
      id: Math.random().toString(36).substring(7),
      title,
      type: "percentage",
      currentValue: 0,
      targetValue: 100,
      progress: 0,
    };

    try {
      await updateGoal(goal.id, {
        keyResults: [...goal.keyResults, newKR]
      });
      loadGoal();
      toast.success("Resultado-Chave adicionado");
    } catch (error) {
      toast.error("Erro ao adicionar resultado-chave");
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (!goal) return <div>Meta não encontrada</div>;

  return (
    <div className="flex flex-col h-full p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <Button 
        variant="ghost" 
        onClick={() => router.back()} 
        className="w-fit -ml-2 text-muted-foreground hover:text-foreground gap-2 font-bold"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para Metas
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div 
                className="p-3 rounded-2xl" 
                style={{ backgroundColor: `${goal.color}20`, color: goal.color }}
              >
                <Target className="w-8 h-8" />
              </div>
              <h1 className="text-4xl font-black tracking-tight">{goal.title}</h1>
            </div>
            <p className="text-xl text-muted-foreground leading-relaxed">
              {goal.description}
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black flex items-center gap-2">
                <PieChart className="w-6 h-6 text-primary" />
                Resultados-Chave
              </h2>
              <Button onClick={handleAddKeyResult} variant="outline" size="sm" className="font-bold gap-2">
                <PlusCircle className="w-4 h-4" />
                Adicionar KR
              </Button>
            </div>
            <div className="space-y-4">
              {goal.keyResults.length === 0 ? (
                <div className="p-10 border-2 border-dashed rounded-2xl text-center text-muted-foreground">
                  Nenhum resultado-chave definido.
                </div>
              ) : (
                goal.keyResults.map((kr) => (
                  <KeyResultItem key={kr.id} kr={kr} />
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-8 bg-card border-2 rounded-3xl shadow-xl shadow-primary/5 space-y-8 sticky top-8">
            <div className="text-center space-y-4">
              <div className="relative inline-flex items-center justify-center">
                <div className="text-5xl font-black text-primary drop-shadow-sm">
                  {Math.round(goal.progress)}%
                </div>
                <div className="absolute inset-0 -m-4 border-4 border-primary/10 rounded-full border-t-primary animate-pulse" style={{ animationDuration: '3s' }} />
              </div>
              <div className="font-bold text-muted-foreground uppercase tracking-widest text-xs">
                Progresso Geral
              </div>
            </div>

            <Progress value={goal.progress} className="h-3 shadow-inner" style={{ "--primary": goal.color } as any} />

            <div className="space-y-4 pt-4 border-t border-border/50">
              <div className="flex items-center gap-3 text-sm font-medium">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Período:</span>
                <span>{goal.period}</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-medium">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Proprietário:</span>
                <span>{user?.displayName || "Você"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-medium">
                <Trophy className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Status:</span>
                <span className="capitalize px-2 py-0.5 bg-primary/10 rounded text-primary text-[10px] font-bold">
                  {goal.status}
                </span>
              </div>
            </div>

            <Button className="w-full h-12 font-bold rounded-xl shadow-lg shadow-primary/20">
              Gerar Relatório IA
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
