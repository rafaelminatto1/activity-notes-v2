"use client";

import { memo } from "react";
import { Handle, Position, NodeProps, Node } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

type NoteLinkNodeData = Node<{
  noteId: string;
  title: string;
  icon: string;
}, 'noteLink'>;

const NoteLinkNode = ({ data, selected }: NodeProps<NoteLinkNodeData>) => {
  const noteId = data.noteId as string;
  const title = (data.title as string) || "Nota sem título";
  const icon = (data.icon as string) || "📄";

  return (
    <div
      className={cn(
        "relative min-w-[200px] bg-card border rounded-xl shadow-lg transition-all duration-200 group overflow-hidden",
        selected ? "ring-2 ring-primary border-primary" : "border-border"
      )}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2" />
      
      <div className="flex items-center gap-3 p-3 bg-muted/30">
        <span className="text-xl">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate">{title}</p>
          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Nota Conectada</p>
        </div>
        <Link 
          href={`/documents/${noteId}`} 
          className="p-1.5 rounded-lg bg-primary/10 text-primary opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
      
      <div className="p-3 border-t border-border/50">
        <p className="text-xs text-muted-foreground line-clamp-2">Clique no ícone para abrir a nota completa.</p>
      </div>
    </div>
  );
};

export default memo(NoteLinkNode);
