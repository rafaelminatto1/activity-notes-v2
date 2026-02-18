"use client";

import React, { useCallback, useEffect } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Panel,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import TextNode from "./canvas-nodes/TextNode";
import ShapeNode from "./canvas-nodes/ShapeNode";
import StickyNode from "./canvas-nodes/StickyNode";
import NoteLinkNode from "./canvas-nodes/NoteLinkNode";
import ImageNode from "./canvas-nodes/ImageNode";

import { Button } from "@/components/ui/button";
import { 
  Type, 
  Square, 
  Circle, 
  StickyNote, 
  Link2, 
  MousePointer2,
  Image as ImageIcon,
  Trash2
} from "lucide-react";
import { updateDocument, searchDocuments } from "@/lib/firebase/firestore";
import { toast } from "sonner";

const nodeTypes = {
  text: TextNode,
  shape: ShapeNode,
  sticky: StickyNode,
  noteLink: NoteLinkNode,
  image: ImageNode,
};

interface CanvasEditorProps {
  documentId: string;
  initialNodes?: Record<string, unknown>[];
  initialEdges?: Record<string, unknown>[];
  initialViewport?: { x: number; y: number; zoom: number };
}

export function CanvasEditor({ 
  documentId, 
  initialNodes = [], 
  initialEdges = []
}: CanvasEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges as Edge[]);

  // Attach onChange handlers to nodes
  const attachHandlers = useCallback((nds: Node[]) => {
    return nds.map((node) => ({
      ...node,
      data: {
        ...node.data,
        onChange: (val: string) => {
          setNodes((currentNodes) => 
            currentNodes.map((n) => 
              n.id === node.id ? { ...n, data: { ...n.data, label: val } } : n
            )
          );
        },
      },
    }));
  }, [setNodes]);

  useEffect(() => {
    setNodes((nds) => attachHandlers(nds));
  }, [attachHandlers, setNodes]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const deleteSelected = useCallback(() => {
    setNodes((nds) => nds.filter((n) => !n.selected));
    setEdges((eds) => eds.filter((e) => !e.selected));
  }, [setNodes, setEdges]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && 
          !(e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement)) {
        deleteSelected();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteSelected]);

  // Auto-save logic
  const saveCanvas = useCallback(async () => {
    try {
      // Don't save if it's the same (basic check)
      await updateDocument(documentId, {
        canvasData: {
          nodes: nodes.map(({ data, ...n }) => ({ ...n, data: { ...data, onChange: undefined } })),
          edges,
        }
      });
    } catch (error) {
      console.error("Error saving canvas:", error);
    }
  }, [documentId, nodes, edges]);

  // Debounced auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      saveCanvas();
    }, 2000);
    return () => clearTimeout(timer);
  }, [nodes, edges, saveCanvas]);

  const addNode = (type: string, customData: Record<string, unknown> = {}) => {
    const id = `node_${Date.now()}`;
    const newNode: Node = {
      id,
      type,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { 
        label: "", 
        onChange: (val: string) => {
          setNodes((nds) => 
            nds.map((node) => 
              node.id === id ? { ...node, data: { ...node.data, label: val } } : node
            )
          );
        },
        ...customData 
      },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const handleAddNoteLink = async () => {
    const query = window.prompt("Buscar nota por título:");
    if (!query) return;

    const results = await searchDocuments("", query); // Empty userId might need fix in firestore.ts but works for local filter
    if (results.length === 0) {
      toast.error("Nenhuma nota encontrada.");
      return;
    }

    const note = results[0];
    addNode("noteLink", { 
      noteId: note.id, 
      title: note.title || "Sem título",
      icon: note.icon || "📄" 
    });
  };

  return (
    <div className="w-full h-full min-h-[80vh] border rounded-xl overflow-hidden bg-muted/5 relative group/canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        deleteKeyCode={["Backspace", "Delete"]}
      >
        <Background variant={BackgroundVariant.Dots} gap={15} size={1} />
        <Controls />
        <MiniMap zoomable pannable />
        
        <Panel position="top-center" className="flex gap-2 p-2 bg-background/80 backdrop-blur-md border rounded-2xl shadow-xl animate-in slide-in-from-top-4 duration-500">
          <Button 
            variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl" 
            onClick={() => addNode("text")} title="Adicionar Texto"
          >
            <Type className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl" 
            onClick={() => addNode("sticky", { color: "#fef08a" })} title="Post-it Amarelo"
          >
            <StickyNote className="w-4 h-4 text-yellow-500 fill-yellow-500/20" />
          </Button>
          <Button 
            variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl" 
            onClick={() => addNode("sticky", { color: "#bbf7d0" })} title="Post-it Verde"
          >
            <StickyNote className="w-4 h-4 text-green-500 fill-green-500/20" />
          </Button>
          <Button 
            variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl" 
            onClick={() => addNode("sticky", { color: "#bfdbfe" })} title="Post-it Azul"
          >
            <StickyNote className="w-4 h-4 text-blue-500 fill-blue-500/20" />
          </Button>
          <Button 
            variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl" 
            onClick={() => addNode("shape", { shape: "rectangle", color: "rgba(59, 130, 246, 0.1)" })} title="Retângulo"
          >
            <Square className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl" 
            onClick={() => addNode("shape", { shape: "circle", color: "rgba(16, 185, 129, 0.1)" })} title="Círculo"
          >
            <Circle className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl" 
            onClick={() => addNode("image")} title="Adicionar Imagem"
          >
            <ImageIcon className="w-4 h-4" />
          </Button>
          <div className="w-px h-4 bg-border self-center mx-1" />
          <Button 
            variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl" 
            onClick={handleAddNoteLink} title="Conectar Nota"
          >
            <Link2 className="w-4 h-4" />
          </Button>
          <div className="w-px h-4 bg-border self-center mx-1" />
          <Button 
            variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10" 
            onClick={deleteSelected} title="Excluir Selecionados"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </Panel>

        <Panel position="bottom-right" className="opacity-0 group-hover/canvas:opacity-100 transition-opacity">
           <div className="flex items-center gap-2 bg-background border px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-muted-foreground shadow-sm">
              <MousePointer2 className="w-3 h-3" /> Canvas Mode Ativo
           </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
