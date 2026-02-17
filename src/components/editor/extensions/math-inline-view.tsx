"use client";

import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { useState, useEffect, useRef } from "react";
import katex from "katex";
import { Sigma } from "lucide-react";

export function MathInlineView({ node, updateAttributes, selected }: NodeViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [latex, setLatex] = useState(node.attrs.latex || "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    setLatex(node.attrs.latex || "");
  }, [node.attrs.latex]);

  const handleToggleEdit = () => {
    setIsEditing(!isEditing);
  };

  const handleBlur = () => {
    setIsEditing(false);
    updateAttributes({ latex });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur();
    }
    if (e.key === "Escape") {
      setLatex(node.attrs.latex);
      setIsEditing(false);
    }
  };

  const renderedHtml = () => {
    try {
      return {
        __html: katex.renderToString(latex || "latex", {
          throwOnError: false,
          displayMode: false,
        }),
      };
    } catch (e) {
      return { __html: latex || "latex" };
    }
  };

  return (
    <NodeViewWrapper className={`inline-block align-baseline ${selected ? "ring-2 ring-primary rounded px-0.5" : ""}`}>
      {isEditing ? (
        <span className="inline-flex items-center gap-1 bg-muted rounded px-1 border border-primary">
          <span className="text-[10px] font-mono text-primary opacity-70">$</span>
          <input
            ref={inputRef}
            className="bg-transparent outline-none min-w-[50px] max-w-[200px] text-sm font-mono"
            value={latex}
            onChange={(e) => setLatex(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            style={{ width: `${Math.max(latex.length, 1) + 1}ch` }}
          />
          <span className="text-[10px] font-mono text-primary opacity-70">$</span>
        </span>
      ) : (
        <span
          className="math-inline-container mx-1 px-1 rounded cursor-pointer border border-transparent hover:border-primary/30 transition-colors"
          onClick={handleToggleEdit}
          dangerouslySetInnerHTML={renderedHtml()}
        />
      )}
    </NodeViewWrapper>
  );
}
