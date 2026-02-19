"use client";

import React, { useCallback, useEffect, useState } from "react";
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
  Viewport,
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
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { Document } from "@/types/document";

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
  editable?: boolean;
}

export function CanvasEditor({ 
  documentId, 
  initialNodes = [], 
  initialEdges = [],
  initialViewport,
  editable = true,
}: CanvasEditorProps) {
  const { user } = useAuth();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges as Edge[]);
  const [viewport, setViewport] = useState<Viewport>(
    initialViewport ?? { x: 0, y: 0, zoom: 1 }
  );
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteSearchTerm, setNoteSearchTerm] = useState("");
  const [noteSearching, setNoteSearching] = useState(false);
  const [noteSearchResults, setNoteSearchResults] = useState<Document[]>([]);
  const [noteSearchError, setNoteSearchError] = useState("");

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
    if (!editable) return;
    setNodes((nds) => nds.filter((n) => !n.selected));
    setEdges((eds) => eds.filter((e) => !e.selected));
  }, [editable, setNodes, setEdges]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!editable) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && 
          !(e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement)) {
        deleteSelected();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editable, deleteSelected]);

  // Auto-save logic
  const saveCanvas = useCallback(async () => {
    if (!editable) return;
    try {
      // Don't save if it's the same (basic check)
      await updateDocument(documentId, {
        canvasData: {
          nodes: nodes.map(({ data, ...n }) => ({ ...n, data: { ...data, onChange: undefined } })),
          edges,
          viewport,
        }
      });
    } catch (error) {
      console.error("Error saving canvas:", error);
    }
  }, [documentId, nodes, edges, viewport, editable]);

  // Debounced auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      saveCanvas();
    }, 2000);
    return () => clearTimeout(timer);
  }, [nodes, edges, viewport, saveCanvas]);

  const addNode = (type: string, customData: Record<string, unknown> = {}) => {
    if (!editable) return;
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

  const openNoteDialog = () => {
    if (!editable) return;
    if (!user?.uid) {
      toast.error("Sessão inválida para buscar notas.");
      return;
    }
    setNoteSearchTerm("");
    setNoteSearchResults([]);
    setNoteSearchError("");
    setNoteDialogOpen(true);
  };

  const handleNoteSearch = async () => {
    if (!user?.uid) return;
    if (!noteSearchTerm.trim()) {
      setNoteSearchError("Digite um termo para buscar notas.");
      setNoteSearchResults([]);
      return;
    }

    setNoteSearching(true);
    setNoteSearchError("");

    try {
      const results = await searchDocuments(user.uid, noteSearchTerm.trim());
      setNoteSearchResults(results);
      if (results.length === 0) {
        setNoteSearchError("Nenhuma nota encontrada.");
      }
    } catch {
      setNoteSearchError("Erro ao buscar notas.");
      toast.error("Erro ao buscar notas.");
    } finally {
      setNoteSearching(false);
    }
  };

  const handleSelectNote = (note: Document) => {
    addNode("noteLink", {
      noteId: note.id,
      title: note.title || "Sem título",
      icon: note.icon || "📄",
    });
    setNoteDialogOpen(false);
    setNoteSearchTerm("");
    setNoteSearchResults([]);
    setNoteSearchError("");
  };

  return (
    <div className="w-full h-full min-h-[80vh] border rounded-xl overflow-hidden bg-muted/5 relative group/canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onInit={(instance) => setViewport(instance.getViewport())}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onMoveEnd={(_, nextViewport) => setViewport(nextViewport)}
        nodeTypes={nodeTypes}
        fitView={!initialViewport}
        defaultViewport={initialViewport}
        nodesDraggable={editable}
        nodesConnectable={editable}
        elementsSelectable={editable}
        snapToGrid
        snapGrid={[15, 15]}
        deleteKeyCode={editable ? ["Backspace", "Delete"] : null}
      >
        <Background variant={BackgroundVariant.Dots} gap={15} size={1} />
        <Controls />
        <MiniMap zoomable pannable />
        
        {editable && (
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
            onClick={openNoteDialog} title="Conectar Nota"
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
        )}

        <Panel position="bottom-right" className="opacity-0 group-hover/canvas:opacity-100 transition-opacity">
           <div className="flex items-center gap-2 bg-background border px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-muted-foreground shadow-sm">
              <MousePointer2 className="w-3 h-3" /> Canvas Mode Ativo
           </div>
        </Panel>
      </ReactFlow>

      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="sm:max-w-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>Conectar nota</DialogTitle>
            <DialogDescription>Busque e vincule notas existentes ao canvas.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-1.5">
              <Label htmlFor="note-search">Termo de busca</Label>
              <Input
                id="note-search"
                placeholder="Título ou palavra-chave"
                value={noteSearchTerm}
                onChange={(event) => setNoteSearchTerm(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleNoteSearch();
                  }
                }}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNoteDialogOpen(false)}
                disabled={noteSearching}
              >
                Fechar
              </Button>
              <Button onClick={handleNoteSearch} size="sm" disabled={noteSearching}>
                Buscar
              </Button>
            </div>

            {noteSearching && <Skeleton className="h-8 w-full" />}

            {noteSearchError && (
              <p className="text-xs text-destructive">{noteSearchError}</p>
            )}

            <ScrollArea className="max-h-72 rounded-lg border border-border/70">
              {noteSearchResults.length === 0 && !noteSearching ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">
                  Pesquise por um termo para encontrar notas.
                </p>
              ) : (
                <div className="space-y-2 p-3">
                  {noteSearchResults.map((note) => (
                    <button
                      key={note.id}
                      type="button"
                      onClick={() => handleSelectNote(note)}
                      className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{note.title || "Sem título"}</span>
                        <span className="text-xs text-muted-foreground">{note.icon || "📄"}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">Conectar</span>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
