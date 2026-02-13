"use client";

import { useState } from "react";
import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { ChevronRight } from "lucide-react";

export function ToggleView({ node, updateAttributes }: NodeViewProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <NodeViewWrapper className="toggle-block my-3 rounded-md border border-border">
      <div
        className="flex cursor-pointer items-center gap-2 p-3 select-none"
        contentEditable={false}
        onClick={() => setIsOpen(!isOpen)}
      >
        <ChevronRight
          className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? "rotate-90" : ""}`}
        />
        <input
          type="text"
          value={node.attrs.title}
          onChange={(e) => updateAttributes({ title: e.target.value })}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 bg-transparent font-medium outline-none"
          placeholder="Título do toggle..."
        />
      </div>
      {isOpen && (
        <div className="border-t border-border px-3 py-2 pl-9">
          <NodeViewContent className="min-h-[1em]" />
        </div>
      )}
    </NodeViewWrapper>
  );
}
