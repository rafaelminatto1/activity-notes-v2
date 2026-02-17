"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ProjectProgress } from "@/types/portfolio";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PortfolioChartsProps {
  projects: ProjectProgress[];
}

export function PortfolioCharts({ projects }: PortfolioChartsProps) {
  const statusData = [
    { name: "A Fazer", value: projects.reduce((acc, p) => acc + p.taskStats.todo, 0), color: "#94a3b8" },
    { name: "Em Progresso", value: projects.reduce((acc, p) => acc + p.taskStats.in_progress, 0), color: "#3b82f6" },
    { name: "Concluído", value: projects.reduce((acc, p) => acc + p.taskStats.done, 0), color: "#10b981" },
  ].filter(d => d.value > 0);

  const progressData = projects.map(p => ({
    name: p.name,
    progresso: p.progress,
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Distribuição de Tarefas
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Progresso por Projeto (%)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={progressData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
              <Bar dataKey="progresso" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
