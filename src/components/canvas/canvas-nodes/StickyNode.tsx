"use client";

import { memo } from "react";
import { Handle, Position, NodeProps, NodeResizer, Node } from "@xyflow/react";
import { cn } from "@/lib/utils";

type StickyNodeData = Node<{
  label: string;
  color?: string;
  onChange: (val: string) => void;
}, 'sticky'>;

const StickyNode = ({ data, selected }: NodeProps<StickyNodeData>) => {
  const color = (data.color as string) || "#fef08a"; // Default yellow

  return (
    <div
      className={cn(
        "relative min-h-[100px] min-w-[100px] p-4 shadow-xl flex items-center justify-center text-center font-medium transition-all duration-200",
        selected ? "ring-2 ring-primary" : "ring-1 ring-black/5"
      )}
      style={{ backgroundColor: color }}
    >
      <NodeResizer minWidth={100} minHeight={100} isVisible={selected} lineClassName="border-primary" handleClassName="h-2 w-2 bg-white border-primary border" />
      <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-black/20" />
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-black/20" />
      
      <textarea
        className="bg-transparent border-none outline-none w-full h-full resize-none text-sm text-black/80 placeholder:text-black/30"
        value={(data.label as string) || ""}
        onChange={(e) => data.onChange?.(e.target.value)}
        placeholder="Digite algo..."
      />
    </div>
  );
};

export default memo(StickyNode);
