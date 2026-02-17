"use client";

import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Task } from "@/types/smart-note";
import { Sprint } from "@/types/project";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BurndownChartProps {
  sprint: Sprint;
  tasks: Task[];
}

export function BurndownChart({ sprint, tasks }: BurndownChartProps) {
  const chartData = useMemo(() => {
    if (!sprint || !sprint.startDate || !sprint.endDate) return [];

    const start = sprint.startDate.toDate();
    const end = sprint.endDate.toDate();
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    const days = [];
    for (let i = 0; i < totalDays; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      days.push(date);
    }

    const totalPoints = tasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
    
    const data = days.map((date, index) => {
      // Ideal trend: linear reduction from total to 0
      const ideal = totalPoints - (totalPoints / (totalDays - 1)) * index;
      
      // Actual trend: total points minus points of tasks completed before or on this day
      const completedPoints = tasks
        .filter((task) => {
          if (task.status !== "done" || !task.completedAt) return false;
          const completedDate = task.completedAt.toDate();
          // Normalize to end of day for comparison
          const compareDate = new Date(date);
          compareDate.setHours(23, 59, 59, 999);
          return completedDate <= compareDate;
        })
        .reduce((sum, task) => sum + (task.storyPoints || 0), 0);

      const actual = totalPoints - completedPoints;

      // Don't show actual for future days
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const isFuture = date > today;

      return {
        name: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        ideal: Math.max(0, parseFloat(ideal.toFixed(1))),
        actual: isFuture ? null : actual,
      };
    });

    return data;
  }, [sprint, tasks]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Burndown Chart</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="name" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                label={{ value: 'Story Points', angle: -90, position: 'insideLeft', fontSize: 12 }}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background border rounded-lg p-2 shadow-sm text-xs">
                        <p className="font-bold">{payload[0].payload.name}</p>
                        <p className="text-blue-500">Ideal: {payload[0].value}</p>
                        {payload[1] && payload[1].value !== null && (
                          <p className="text-emerald-500">Real: {payload[1].value}</p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend verticalAlign="top" height={36}/>
              <Line
                type="monotone"
                dataKey="ideal"
                name="Tendência Ideal"
                stroke="#3b82f6"
                strokeDasharray="5 5"
                dot={false}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="actual"
                name="Realizado"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
