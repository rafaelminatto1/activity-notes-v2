"use client";

import { Goal } from "@/types/goal";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { Target, TrendingUp, Users } from "lucide-react";

interface GoalCardProps {
  goal: Goal;
}

export function GoalCard({ goal }: GoalCardProps) {
  return (
    <Link href={`/goals/${goal.id}`}>
      <div className="group relative bg-card hover:bg-accent/5 transition-all border rounded-2xl p-6 shadow-sm hover:shadow-md cursor-pointer border-transparent hover:border-primary/20">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div 
              className="p-2.5 rounded-xl bg-primary/10" 
              style={{ backgroundColor: `${goal.color}15`, color: goal.color }}
            >
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                {goal.title}
              </h3>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                {goal.period}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-primary">
              {Math.round(goal.progress)}%
            </span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-6">
          {goal.description}
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground/70">
            <span>Progresso Geral</span>
            <span>{goal.keyResults.length} Resultados-Chave</span>
          </div>
          <Progress 
            value={goal.progress} 
            className="h-2 bg-muted shadow-inner" 
            style={{ "--primary": goal.color } as any}
          />
        </div>

        <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            <span className="font-medium">Proprietário: {goal.ownerId.substring(0, 5)}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-muted rounded-full text-[10px] font-bold uppercase text-muted-foreground">
            <TrendingUp className="w-3 h-3" />
            <span>{goal.status}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
