"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  ChevronRight, 
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Settings
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getPortfolio, getPortfolioProgress } from "@/lib/firebase/portfolios";
import { Portfolio, ProjectProgress } from "@/types/portfolio";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { PortfolioCharts } from "@/components/charts/portfolio-charts";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function PortfolioDetailPage() {
  const { portfolioId } = useParams() as { portfolioId: string };
  const router = useRouter();
  const { user } = useAuth();
  
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [projects, setProjects] = useState<ProjectProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !portfolioId) return;

    const loadData = async () => {
      const data = await getPortfolio(portfolioId);
      if (data) {
        setPortfolio(data);
        const progress = await getPortfolioProgress(data);
        setProjects(progress);
      }
      setIsLoading(false);
    };

    loadData();
  }, [user, portfolioId]);

  const stats = useMemo(() => {
    const total = projects.length;
    const completed = projects.filter(p => p.status === "completed").length;
    const onTrack = projects.filter(p => p.status === "on_track").length;
    const atRisk = projects.filter(p => p.status === "at_risk").length;
    const offTrack = projects.filter(p => p.status === "off_track").length;
    const avgProgress = total > 0 ? Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / total) : 0;

    return { total, completed, onTrack, atRisk, offTrack, avgProgress };
  }, [projects]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-bold">Portfólio não encontrado</h2>
        <Button onClick={() => router.push("/portfolios")}>Voltar para Portfólios</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-6 space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/portfolios")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{portfolio.name}</h1>
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">Portfólio</Badge>
            </div>
            <p className="text-muted-foreground">{portfolio.description || "Gerenciamento estratégico de projetos."}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="h-4 w-4" /> Editar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
        <StatCard label="Média de Progresso" value={`${stats.avgProgress}%`} color="text-primary" icon={TrendingUp} />
        <StatCard label="No Prazo" value={stats.onTrack} color="text-emerald-600" icon={CheckCircle2} />
        <StatCard label="Em Risco" value={stats.atRisk} color="text-amber-600" icon={Clock} />
        <StatCard label="Atrasados" value={stats.offTrack} color="text-destructive" icon={AlertCircle} />
      </div>

      {/* Charts */}
      <PortfolioCharts projects={projects} />

      {/* Projects Table */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Projetos no Portfólio</h2>
        <div className="border rounded-2xl overflow-hidden bg-card">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Projeto</th>
                <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Status</th>
                <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Progresso</th>
                <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Data de Início</th>
                <th className="px-6 py-4 font-bold text-right uppercase tracking-widest text-[10px]">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {projects.map((p) => (
                <tr key={p.projectId} className="group hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-medium">{p.name}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-6 py-4 min-w-[200px]">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full transition-all duration-1000",
                            p.status === "completed" ? "bg-emerald-500" : 
                            p.status === "off_track" ? "bg-destructive" : 
                            p.status === "at_risk" ? "bg-amber-500" : "bg-primary"
                          )}
                          style={{ width: `${p.progress}%` }} 
                        />
                      </div>
                      <span className="font-bold tabular-nums">{p.progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                    {p.startDate ? p.startDate.toDate().toLocaleDateString() : "---"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => router.push(`/projects/${p.projectId}`)}
                    >
                      Abrir <ChevronRight className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
              {projects.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">Nenhum projeto adicionado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, icon: Icon }: { label: string; value: string | number; color: string; icon: React.ElementType }) {
  return (
    <Card className="flex flex-col items-center justify-center p-6 space-y-2 border-primary/10">
      <div className={cn("p-2 rounded-lg bg-muted/50 mb-1", color)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className={cn("text-3xl font-black", color)}>{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</div>
    </Card>
  );
}

function StatusBadge({ status }: { status: ProjectProgress["status"] }) {
  const configs = {
    on_track: { label: "No Prazo", className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800" },
    at_risk: { label: "Em Risco", className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800" },
    off_track: { label: "Atrasado", className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800" },
    completed: { label: "Concluído", className: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800" },
  };

  const config = configs[status];

  return (
    <Badge variant="outline" className={cn("rounded-full px-2 py-0 h-5 text-[10px] font-bold uppercase tracking-tight", config.className)}>
      {config.label}
    </Badge>
  );
}
