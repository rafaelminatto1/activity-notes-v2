"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { subscribeToGoals, createGoal } from "@/lib/firebase/goals";
import { Goal } from "@/types/goal";
import { GoalCard } from "@/components/goals/goal-card";
import { Button } from "@/components/ui/button";
import { Plus, Target } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function GoalsPage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToGoals(user.uid, (data) => {
      setGoals(data);
      setIsLoading(false);
    });
    return () => unsub();
  }, [user]);

  const handleCreateGoal = async () => {
    if (!user) return;
    const title = window.prompt("Título da Meta:");
    if (!title) return;

    try {
      await createGoal(user.uid, {
        title,
        description: "Nova meta estratégica",
        ownerId: user.uid,
        period: "Q1 2026",
        color: "#3b82f6",
        keyResults: [],
      });
      toast.success("Meta criada com sucesso!");
    } catch {
      toast.error("Erro ao criar meta");
    }
  };

  return (
    <div className="flex flex-col h-full p-8 max-w-7xl mx-auto space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
            <Target className="w-10 h-10 text-primary" />
            Metas e OKRs
          </h1>
          <p className="text-muted-foreground text-lg">
            Acompanhe seus objetivos estratégicos e resultados-chave.
          </p>
        </div>
        <Button onClick={handleCreateGoal} className="h-12 px-6 rounded-xl font-bold gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
          <Plus className="w-5 h-5" />
          Nova Meta
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-2xl" />
          ))
        ) : goals.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl bg-muted/20">
            <Target className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-bold text-muted-foreground">Nenhuma meta definida</h3>
            <p className="text-muted-foreground mb-6">Comece criando sua primeira meta estratégica.</p>
            <Button variant="outline" onClick={handleCreateGoal}>Criar Meta agora</Button>
          </div>
        ) : (
          goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))
        )}
      </div>
    </div>
  );
}
