"use client";

import { useEffect, useState } from "react";
import { subscribeToAutomationLogs } from "@/lib/firebase/automations";
import { AutomationLog } from "@/types/automation";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  History, 
  CheckCircle2, 
  XCircle, 
  Terminal,
  Activity,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AutomationLogViewProps {
  projectId: string;
}

export function AutomationLogView({ projectId }: AutomationLogViewProps) {
  const [logs, setLogs] = useState<AutomationLog[]>([]);

  useEffect(() => {
    return subscribeToAutomationLogs(projectId, setLogs);
  }, [projectId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <History className="w-5 h-5 text-muted-foreground" />
          Histórico de Execução
        </h3>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-muted rounded-full text-[10px] font-black uppercase text-muted-foreground tracking-widest">
          <Activity className="w-3 h-3" />
          Últimas 24h
        </div>
      </div>

      <div className="space-y-3">
        {logs.length === 0 ? (
          <div className="p-12 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center space-y-3 bg-muted/10">
            <Terminal className="w-8 h-8 text-muted-foreground opacity-20" />
            <p className="text-sm text-muted-foreground font-medium">Nenhuma execução registrada ainda.</p>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="p-4 rounded-xl border bg-card/50 flex items-start gap-4 hover:border-primary/20 transition-colors group">
              <div className={cn(
                "p-2 rounded-lg shrink-0",
                log.status === "success" ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
              )}>
                {log.status === "success" ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              </div>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{log.automationName}</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{log.triggerEvent}</span>
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
                    {formatDistanceToNow(log.executedAt.toDate(), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-mono bg-muted/30 p-2 rounded group-hover:bg-muted/50 transition-colors">
                  {log.details}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
