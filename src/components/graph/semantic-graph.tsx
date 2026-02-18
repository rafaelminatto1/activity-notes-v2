"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/config";
import { Loader2, ZoomIn, ZoomOut, RefreshCw, Search as SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

const GROUP_COLORS: Record<string, string> = {
  "general": "#10b981", // Emerald
  "work": "#3b82f6",    // Blue
  "personal": "#f59e0b", // Amber
  "ideas": "#a855f7",   // Purple
  "meeting": "#ef4444", // Red
};

export function SemanticGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ nodes: Node[]; edges: Edge[] } | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [dragging, setDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const router = useRouter();

  const fetchData = async () => {
    setLoading(true);
    try {
      if (!functions) return;
      const getGraph = httpsCallable(functions, "genkitGenerateGraphData");
      const result = await getGraph();
      const graphData = (result.data as any).data;
      
      if (graphData && graphData.nodes) {
        graphData.nodes.forEach((node: Node) => {
          node.x = Math.random() * 800;
          node.y = Math.random() * 600;
          node.vx = 0;
          node.vy = 0;
        });
        setData(graphData);
      } else {
        setData({ nodes: [], edges: [] });
      }
    } catch (error) {
      console.error("Graph error:", error);
      setData({ nodes: [], edges: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredNodes = useMemo(() => {
    if (!data) return [];
    if (!searchTerm) return data.nodes;
    return data.nodes.filter(n => n.label.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [data, searchTerm]);

  useEffect(() => {
    if (!data || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const simulate = () => {
      if (!data || data.nodes.length === 0) return;

      const repulsion = 1800;
      const attraction = 0.04;
      const damping = 0.88;
      const centerForce = 0.015;

      data.nodes.forEach(node => {
        data.nodes.forEach(other => {
          if (node === other) return;
          const dx = node.x! - other.x!;
          const dy = node.y! - other.y!;
          const distSq = dx * dx + dy * dy || 1;
          const dist = Math.sqrt(distSq);
          if (dist < 280) {
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

        const dx = 500 - node.x!;
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

      // Edges
      data.edges.forEach(edge => {
        const source = data.nodes.find(n => n.id === edge.source);
        const target = data.nodes.find(n => n.id === edge.target);
        if (source && target) {
          const isHighlighted = (hoveredNodeId === source.id || hoveredNodeId === target.id);
          ctx.beginPath();
          ctx.moveTo(source.x!, source.y!);
          ctx.lineTo(target.x!, target.y!);
          ctx.strokeStyle = isHighlighted ? "rgba(16, 185, 129, 0.4)" : "rgba(16, 185, 129, 0.1)";
          ctx.lineWidth = (edge.value * 2) * (isHighlighted ? 1.5 : 1);
          ctx.stroke();
        }
      });

      // Nodes
      data.nodes.forEach(node => {
        const isMatch = searchTerm && node.label.toLowerCase().includes(searchTerm.toLowerCase());
        const isHovered = hoveredNodeId === node.id;
        const color = GROUP_COLORS[node.group || "general"] || GROUP_COLORS.general;

        // Shadow/Glow
        ctx.shadowBlur = (isMatch || isHovered) ? 25 : 12;
        ctx.shadowColor = color;
        
        ctx.fillStyle = color;
        ctx.beginPath();
        const radius = (isMatch || isHovered) ? 10 : 7;
        ctx.arc(node.x!, node.y!, radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        if (isMatch || isHovered || transform.scale > 0.8) {
          ctx.font = isHovered ? "bold 13px Inter, sans-serif" : "500 11px Inter, sans-serif";
          const labelWidth = ctx.measureText(node.label).width;
          
          // Background for label
          ctx.fillStyle = isHovered ? "rgba(0,0,0,0.85)" : "rgba(0,0,0,0.6)";
          ctx.roundRect(node.x! + 12, node.y! - 12, labelWidth + 14, 20, 6);
          ctx.fill();
          
          ctx.fillStyle = "#fff";
          ctx.fillText(node.label, node.x! + 19, node.y! + 2);
          
          if (isHovered) {
             ctx.strokeStyle = color;
             ctx.lineWidth = 2;
             ctx.stroke();
          }
        }
      });

      ctx.restore();
      animationFrameId = requestAnimationFrame(simulate);
    };

    simulate();
    return () => cancelAnimationFrame(animationFrameId);
  }, [data, transform, searchTerm, hoveredNodeId]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left - transform.x) / transform.scale;
    const y = (e.clientY - rect.top - transform.y) / transform.scale;

    if (data) {
      const node = data.nodes.find(n => {
        const dist = Math.sqrt((n.x! - x) ** 2 + (n.y! - y) ** 2);
        return dist < 15;
      });
      setHoveredNodeId(node?.id || null);
    }

    if (!dragging) return;
    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;
    setTransform(t => ({ ...t, x: t.x + dx, y: t.y + dy }));
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => setDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform(t => ({ ...t, scale: Math.max(0.1, Math.min(5, t.scale * scaleFactor)) }));
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (hoveredNodeId) {
      router.push(`/documents/${hoveredNodeId}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] w-full bg-muted/5 rounded-lg border border-emerald-500/10 animate-pulse">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500 mb-4" />
        <p className="text-sm text-muted-foreground">Mapeando neurônios digitais...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar nota no grafo..." 
            className="pl-9 bg-background/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
           {Object.entries(GROUP_COLORS).map(([group, color]) => (
             <div key={group} className="flex items-center gap-1.5">
               <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
               <span className="text-[10px] font-medium uppercase text-muted-foreground tracking-wider">{group}</span>
             </div>
           ))}
        </div>
      </div>

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
              Semantic Engine V2.1
            </span>
          </div>
        </div>

        <canvas
          ref={canvasRef}
          width={1000}
          height={600}
          className="w-full h-[600px] cursor-move"
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        />
        
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground bg-background/50 px-2 py-1 rounded border">
          Arraste para mover • Scroll para zoom • Passe o mouse para detalhes
        </div>
      </div>
    </div>
  );
}

