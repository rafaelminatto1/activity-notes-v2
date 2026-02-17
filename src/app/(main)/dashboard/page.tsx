"use client";

import React, { useState, useEffect } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { 
  LayoutDashboard, 
  CheckCircle2, 
  FileText, 
  Sparkles, 
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Spinner } from "@/components/ui/spinner";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function WorkspaceDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      // Aggregate data from Firestore
      const tasksSnap = await getDocs(query(collection(db!, "tasks"), where("userId", "==", user.uid)));
      const docsSnap = await getDocs(query(collection(db!, "documents"), where("userId", "==", user.uid)));
      
      const totalTasks = tasksSnap.size;
      const completedTasks = tasksSnap.docs.filter(d => d.data().status === "done").length;
      const totalDocs = docsSnap.size;

      // Mock chart data (In a real app, calculate from actual timestamps)
      const activityData = [
        { name: "Seg", tasks: 4, docs: 2 },
        { name: "Ter", tasks: 7, docs: 5 },
        { name: "Qua", tasks: 5, docs: 3 },
        { name: "Qui", tasks: 10, docs: 8 },
        { name: "Sex", tasks: 8, docs: 4 },
        { name: "Sáb", tasks: 3, docs: 1 },
        { name: "Dom", tasks: 2, docs: 0 },
      ];

      const taskStatusData = [
        { name: "Concluído", value: completedTasks },
        { name: "Pendente", value: totalTasks - completedTasks },
      ];

      setStats({
        totalTasks,
        completedTasks,
        totalDocs,
        activityData,
        taskStatusData
      });
      setLoading(false);
    };

    fetchStats();
  }, [user]);

  if (loading) return <div className="flex h-full items-center justify-center"><Spinner /></div>;

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 overflow-y-auto">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Card className="p-2 px-4 bg-primary/10 text-primary border-none flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Insights Premium</span>
          </Card>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total de Notas" 
          value={stats.totalDocs} 
          icon={<FileText className="h-4 w-4 text-muted-foreground" />}
          description="+12% desde o mês passado"
          trend="up"
        />
        <StatCard 
          title="Tarefas Concluídas" 
          value={stats.completedTasks} 
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          description={`${Math.round((stats.completedTasks/stats.totalTasks)*100)}% de taxa de conclusão`}
          trend="up"
        />
        <StatCard 
          title="Usos de IA" 
          value="128" 
          icon={<Sparkles className="h-4 w-4 text-purple-500" />}
          description="Dentro do seu limite diário"
        />
        <StatCard 
          title="Tempo Ativo" 
          value="14h" 
          icon={<Clock className="h-4 w-4 text-blue-500" />}
          description="Foco intenso esta semana"
          trend="up"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Atividade do Workspace</CardTitle>
            <CardDescription>Visualização semanal de progresso em notas e tarefas.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={stats.activityData}>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <Tooltip />
                <Bar dataKey="tasks" fill="#10b981" radius={[4, 4, 0, 0]} name="Tarefas" />
                <Bar dataKey="docs" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Notas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Status das Tarefas</CardTitle>
            <CardDescription>Distribuição de tarefas pendentes e concluídas.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={stats.taskStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.taskStatusData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 text-xs mt-4">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full bg-emerald-500" /> 
                <span>Concluídas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full bg-blue-500" /> 
                <span>Pendentes</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, description, trend }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
          {trend === "up" ? <ArrowUpRight className="h-3 w-3 text-emerald-500" /> : trend === "down" ? <ArrowDownRight className="h-3 w-3 text-red-500" /> : null}
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
