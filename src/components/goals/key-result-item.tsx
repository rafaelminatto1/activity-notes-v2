"use client";

import { KeyResult } from "@/types/goal";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, ListTodo, Hash, Percent } from "lucide-react";

interface KeyResultItemProps {
  kr: KeyResult;
}

export function KeyResultItem({ kr }: KeyResultItemProps) {
  const Icon = kr.type === "tasks" ? ListTodo : kr.type === "percentage" ? Percent : Hash;

  return (
    <div className="p-5 bg-card border rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div className={cn(
          "p-2 rounded-lg bg-muted flex items-center justify-center shrink-0",
          kr.progress === 100 && "bg-green-500/10 text-green-600"
        )}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-bold text-foreground">{kr.title}</h4>
              <p className="text-xs text-muted-foreground">
                {kr.type === "tasks" 
                  ? `${kr.currentValue} de ${kr.targetValue} tarefas concluídas`
                  : `${kr.currentValue} / ${kr.targetValue} ${kr.unit || ""}`}
              </p>
            </div>
            <div className="text-right">
              <span className={cn(
                "text-lg font-black",
                kr.progress === 100 ? "text-green-600" : "text-primary"
              )}>
                {Math.round(kr.progress)}%
              </span>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <Progress value={kr.progress} className="h-2" />
          </div>
        </div>
        <div className="shrink-0">
          {kr.progress === 100 ? (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          ) : (
            <Circle className="w-5 h-5 text-muted-foreground opacity-20" />
          )}
        </div>
      </div>
    </div>
  );
}
