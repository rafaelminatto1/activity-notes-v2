"use client";

import React from "react";
import { GripVertical } from "lucide-react";

interface DragHandleProps {
  nodeType: string;
  draggable?: boolean;
}

export function DragHandle({ nodeType, draggable = true }: DragHandleProps) {
  return (
    <div
      className={`drag-handle ${nodeType}`}
      data-drag-handle={true}
      draggable={draggable}
    >
      <GripVertical size={16} className="opacity-0 hover:opacity-100 cursor-grab" />
    </div>
  );
}
