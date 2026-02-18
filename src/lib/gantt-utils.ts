import { Task } from "@/types/smart-note";
import { Task as GanttTask } from "gantt-task-react";
import { addDays } from "date-fns";

// Extende a interface da lib para incluir nossos dados extras se necessário
export interface CustomGanttTask extends GanttTask {
  originalTask: Task;
  isCritical?: boolean;
}

export function transformTasksToGantt(tasks: Task[]): CustomGanttTask[] {
  return tasks.map((task) => {
    // Definir datas: Início = createdAt, Fim = dueDate ou Início + 1 dia
    // Se dueDate for menor que createdAt, ajusta para ser igual (marco) ou maior
    const startDate = task.createdAt?.toDate() || new Date();
    let endDate = task.dueDate?.toDate() || addDays(startDate, 1);

    if (endDate < startDate) {
      endDate = startDate;
    }

    // Identificar dependências
    // A lib espera um array de strings (IDs)
    // Nosso modelo tem blockedBy (quem bloqueia esta tarefa)
    const dependencies = task.blockedBy || [];

    return {
      start: startDate,
      end: endDate,
      name: task.title,
      id: task.id,
      type: "task", // Pode ser 'milestone' ou 'project' futuramente
      progress: task.status === "done" ? 100 : task.status === "in_progress" ? 50 : 0,
      isDisabled: false,
      styles: {
        progressColor: task.status === "done" ? "#22c55e" : "#3b82f6",
        progressSelectedColor: "#166534",
        backgroundColor: task.priority === "urgent" ? "#ef4444" : "#93c5fd",
        backgroundSelectedColor: "#1d4ed8",
      },
      dependencies,
      originalTask: task,
      isCritical: false, // Será calculado depois
    };
  });
}

// Algoritmo simplificado para Caminho Crítico (CPM)
// O caminho crítico é a sequência de tarefas dependentes com a maior duração total.
// Tarefas no caminho crítico têm folga zero (não podem atrasar sem atrasar o projeto).
export function calculateCriticalPath(ganttTasks: CustomGanttTask[]): CustomGanttTask[] {
  const taskMap = new Map(ganttTasks.map((t) => [t.id, t]));
  const adjList = new Map<string, string[]>(); // Tarefa -> Quem ela bloqueia (blocking)
  const revAdjList = new Map<string, string[]>(); // Tarefa -> Quem a bloqueia (blockedBy)
  
  // Construir grafo
  ganttTasks.forEach(task => {
    if (!adjList.has(task.id)) adjList.set(task.id, []);
    if (!revAdjList.has(task.id)) revAdjList.set(task.id, []);

    task.dependencies?.forEach(depId => {
      if (taskMap.has(depId)) {
        // depId bloqueia task.id
        if (!adjList.has(depId)) adjList.set(depId, []);
        adjList.get(depId)!.push(task.id);
        
        if (!revAdjList.has(task.id)) revAdjList.set(task.id, []);
        revAdjList.get(task.id)!.push(depId);
      }
    });
  });

  // Calcular Earliest Start (ES) e Earliest Finish (EF)
  // Forward Pass
  const es = new Map<string, number>();
  const ef = new Map<string, number>();
  
  // Ordenação topológica (simplificada com fila para DAG)
  const inDegree = new Map<string, number>();
  ganttTasks.forEach(t => inDegree.set(t.id, (revAdjList.get(t.id) || []).length));
  
  const queue: string[] = [];
  inDegree.forEach((deg, id) => {
    if (deg === 0) {
      es.set(id, taskMap.get(id)!.start.getTime());
      const duration = taskMap.get(id)!.end.getTime() - taskMap.get(id)!.start.getTime();
      ef.set(id, es.get(id)! + duration);
      queue.push(id);
    }
  });

  const sortedTasks: string[] = [];

  while (queue.length > 0) {
    const u = queue.shift()!;
    sortedTasks.push(u);
    
    const uEf = ef.get(u)!;
    
    const neighbors = adjList.get(u) || [];
    for (const v of neighbors) {
      // Relaxamento
      const vStart = taskMap.get(v)!.start.getTime();
      // O início mais cedo de V é o máximo dos fins mais cedo de seus predecessores
      const currentEs = es.get(v) || vStart;
      es.set(v, Math.max(currentEs, uEf));
      
      const vDuration = taskMap.get(v)!.end.getTime() - taskMap.get(v)!.start.getTime();
      ef.set(v, es.get(v)! + vDuration);

      inDegree.set(v, inDegree.get(v)! - 1);
      if (inDegree.get(v) === 0) queue.push(v);
    }
  }

  // Backward Pass para Late Start (LS) e Late Finish (LF)
  // Assumimos que o projeto termina no maior EF
  let projectEnd = 0;
  ef.forEach(time => projectEnd = Math.max(projectEnd, time));

  const ls = new Map<string, number>();
  const lf = new Map<string, number>();
  
  // Inicializa LF com projectEnd para tarefas finais (sem sucessores)
  ganttTasks.forEach(t => {
    if ((adjList.get(t.id) || []).length === 0) {
      lf.set(t.id, projectEnd);
      const duration = t.end.getTime() - t.start.getTime();
      ls.set(t.id, projectEnd - duration);
    } else {
      lf.set(t.id, Number.MAX_SAFE_INTEGER);
    }
  });

  // Processar na ordem inversa
  for (let i = sortedTasks.length - 1; i >= 0; i--) {
    const u = sortedTasks[i];
    const uLf = lf.get(u)!;
    const duration = taskMap.get(u)!.end.getTime() - taskMap.get(u)!.start.getTime();
    ls.set(u, uLf - duration); // Late Start = Late Finish - Duration

    const predecessors = revAdjList.get(u) || [];
    for (const p of predecessors) {
      // O fim mais tarde de P é o mínimo dos inícios mais tarde de seus sucessores
      const pLf = lf.get(p)!;
      lf.set(p, Math.min(pLf, ls.get(u)!));
    }
  }

  // Identificar Caminho Crítico (Float = 0, ou seja, LS - ES = 0)
  // Usamos uma pequena tolerância para float point arithmetic se necessário, mas aqui são inteiros (ms)
  return ganttTasks.map(t => {
    const float = (ls.get(t.id) || 0) - (es.get(t.id) || 0);
    // Consideramos crítico se float for muito pequeno (ex: < 1 minuto)
    const isCritical = Math.abs(float) < 60000;
    
    if (isCritical) {
      return {
        ...t,
        isCritical: true,
        styles: {
          ...t.styles,
          backgroundColor: "#dc2626", // Red for critical path
          progressColor: "#991b1b",
        }
      };
    }
    return t;
  });
}
