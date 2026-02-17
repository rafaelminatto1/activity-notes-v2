"use client";

import { memo } from "react";
import { Handle, Position, NodeProps, NodeResizer, Node } from "@xyflow/react";
import { cn } from "@/lib/utils";

type ShapeNodeData = Node<{
  label: string;
  shape: "rectangle" | "circle" | "diamond";
  color?: string;
  onChange: (val: string) => void;
}, 'shape'>;

const ShapeNode = ({ data, selected }: NodeProps<ShapeNodeData>) => {
  const shape = (data.shape as "rectangle" | "circle" | "diamond") || "rectangle";
  const color = (data.color as string) || "transparent";

  const getShapeClass = () => {
    switch (shape) {
      case "circle": return "rounded-full";
      case "diamond": return "rotate-45";
      default: return "rounded-none";
    }
  };

  const getInnerClass = () => {
    if (shape === "diamond") return "-rotate-45";
    return "";
  };

  return (
    <div
      className={cn(
        "relative min-h-[100px] min-w-[100px] border-2 flex items-center justify-center transition-all duration-200",
        getShapeClass(),
        selected ? "border-primary shadow-lg" : "border-foreground/20"
      )}
      style={{ backgroundColor: color }}
    >
      <NodeResizer minWidth={50} minHeight={50} isVisible={selected} lineClassName="border-primary" handleClassName="h-2 w-2 bg-white border-primary border" />
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      
      <div className={cn("w-full h-full flex items-center justify-center p-2", getInnerClass())}>
        <textarea
          className="bg-transparent border-none outline-none w-full text-center resize-none text-xs font-bold uppercase tracking-widest"
          value={(data.label as string) || ""}
          onChange={(e) => data.onChange?.(e.target.value)}
          placeholder="..."
        />
      </div>
    </div>
  );
};

export default memo(ShapeNode);
