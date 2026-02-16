"use client";

import { useEffect, useRef, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/config";
import { Loader2, ZoomIn, ZoomOut, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Node {
  id: string;
  label: string;
  group?: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface Edge {
  source: string;
  target: string;
  value: number;
}

export function SemanticGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ nodes: Node[]; edges: Edge[] } | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const router = useRouter();

  const fetchData = async () => {
    setLoading(true);
    try {
      if (!functions) return;
      const getGraph = httpsCallable(functions, "genkitGenerateGraphData");
      const result = await getGraph();
      const graphData = (result.data as any).data;
      
      graphData.nodes.forEach((node: Node) => {
        node.x = Math.random() * 800;
        node.y = Math.random() * 600;
        node.vx = 0;
        node.vy = 0;
      });

      setData(graphData);
    } catch (error) {
      console.error("Graph error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!data || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const simulate = () => {
      if (!data) return;

      const repulsion = 1200;
      const attraction = 0.02;
      const damping = 0.85;
      const centerForce = 0.03;

      data.nodes.forEach(node => {
        data.nodes.forEach(other => {
          if (node === other) return;
          const dx = node.x! - other.x!;
          const dy = node.y! - other.y!;
          const distSq = dx * dx + dy * dy || 1;
          const dist = Math.sqrt(distSq);
          if (dist < 200) {
            const force = repulsion / distSq;
            node.vx! += (dx / dist) * force;
            node.vy! += (dy / dist) * force;
          }
        });

        data.edges.forEach(edge => {
          const source = data.nodes.find(n => n.id === edge.source);
          const target = data.nodes.find(n => n.id === edge.target);
          if (source === node && target) {
            const dx = target.x! - node.x!;
            const dy = target.y! - node.y!;
            node.vx! += dx * attraction;
            node.vy! += dy * attraction;
          } else if (target === node && source) {
            const dx = source.x! - node.x!;
            const dy = source.y! - node.y!;
            node.vx! += dx * attraction;
            node.vy! += dy * attraction;
          }
        });

        const dx = 400 - node.x!;
        const dy = 300 - node.y!;
        node.vx! += dx * centerForce;
        node.vy! += dy * centerForce;

        node.vx! *= damping;
        node.vy! *= damping;
        node.x! += node.vx!;
        node.y! += node.vy!;
      });

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(transform.x, transform.y);
      ctx.scale(transform.scale, transform.scale);

      // Edges with gradient-like look
      data.edges.forEach(edge => {
        const source = data.nodes.find(n => n.id === edge.source);
        const target = data.nodes.find(n => n.id === edge.target);
        if (source && target) {
          ctx.beginPath();
          ctx.moveTo(source.x!, source.y!);
          ctx.lineTo(target.x!, target.y!);
          ctx.strokeStyle = "rgba(16, 185, 129, 0.15)";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });

      // Nodes with Glow
      data.nodes.forEach(node => {
        // Shadow/Glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = "rgba(16, 185, 129, 0.4)";
        
        ctx.fillStyle = "#10b981";
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.fillStyle = "currentColor";
        ctx.font = "bold 11px Inter, sans-serif";
        const labelWidth = ctx.measureText(node.label).width;
        
        // Background for label
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.roundRect(node.x! + 10, node.y! - 10, labelWidth + 8, 16, 4);
        ctx.fill();
        
        ctx.fillStyle = "#fff";
        ctx.fillText(node.label, node.x! + 14, node.y! + 2);
      });

      ctx.restore();
      animationFrameId = requestAnimationFrame(simulate);
    };

    simulate();
    return () => cancelAnimationFrame(animationFrameId);
  }, [data, transform]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!data) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left - transform.x) / transform.scale;
    const y = (e.clientY - rect.top - transform.y) / transform.scale;

    const clickedNode = data.nodes.find(node => {
      const dist = Math.sqrt((node.x! - x) ** 2 + (node.y! - y) ** 2);
      return dist < 15;
    });

    if (clickedNode) {
      router.push(`/documents/${clickedNode.id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] w-full bg-muted/5 rounded-lg border border-emerald-500/10 animate-pulse">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500 mb-4" />
        <p className="text-sm text-muted-foreground">Mapeando neurônios digitais...</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden bg-background/50 backdrop-blur-sm rounded-xl border border-emerald-500/20 shadow-2xl relative group">
      <div className="absolute top-4 right-4 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="secondary" size="icon" className="h-8 w-8 bg-background/80" onClick={() => setTransform(t => ({ ...t, scale: t.scale * 1.2 }))}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="icon" className="h-8 w-8 bg-background/80" onClick={() => setTransform(t => ({ ...t, scale: t.scale * 0.8 }))}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="icon" className="h-8 w-8 bg-background/80" onClick={fetchData}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="absolute top-4 left-4 z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            Semantic Engine V2
          </span>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={1000}
        height={600}
        className="w-full h-[600px] cursor-crosshair"
        onClick={handleCanvasClick}
      />
      
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground bg-background/50 px-2 py-1 rounded border">
        Clique nos nós para navegar • Arraste para explorar (Beta)
      </div>
    </div>
  );
}
