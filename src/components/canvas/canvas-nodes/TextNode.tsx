"use client";

import { memo } from "react";
import { Handle, Position, NodeProps, NodeResizer, Node } from "@xyflow/react";
import { cn } from "@/lib/utils";

type TextNodeData = Node<{
  label: string;
  onChange: (val: string) => void;
}, 'text'>;

const TextNode = ({ data, selected }: NodeProps<TextNodeData>) => {
  return (
    <div
      className={cn(
        "relative min-h-[40px] min-w-[150px] p-2 bg-background border rounded-md shadow-sm transition-all duration-200",
        selected ? "ring-2 ring-primary border-primary" : "border-border"
      )}
    >
      <NodeResizer minWidth={100} minHeight={40} isVisible={selected} lineClassName="border-primary" handleClassName="h-2 w-2 bg-white border-primary border" />
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-primary" />
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-primary" />
      
      <textarea
        className="bg-transparent border-none outline-none w-full h-full resize-none text-sm placeholder:text-muted-foreground/50"
        value={(data.label as string) || ""}
        onChange={(e) => data.onChange?.(e.target.value)}
        placeholder="Texto livre..."
      />
    </div>
  );
};

export default memo(TextNode);
