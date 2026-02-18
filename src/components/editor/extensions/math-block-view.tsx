"use client";

import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { useState, useEffect, useRef } from "react";
import katex from "katex";
import { Sigma, Code2, Check, X } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";

export function MathBlockView({ node, updateAttributes, selected }: NodeViewProps) {
  const sourceLatex = node.attrs.latex || "";
  const [isEditing, setIsEditing] = useState(node.attrs.latex === "");
  const [latex, setLatex] = useState(sourceLatex);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const handleToggleEdit = () => {
    if (!isEditing) {
      setLatex(sourceLatex);
    }
    setIsEditing(!isEditing);
  };

  const handleSave = () => {
    setIsEditing(false);
    updateAttributes({ latex });
  };

  const handleCancel = () => {
    setLatex(sourceLatex);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleSave();
    }
    if (e.key === "Escape") {
      handleCancel();
    }
  };

  const previewLatex = isEditing ? latex : sourceLatex;

  const renderedHtml = () => {
    try {
      return {
        __html: katex.renderToString(previewLatex || "f(x) = \int_{-\infty}^{\infty} e^{-x^2} dx", {
          throwOnError: false,
          displayMode: true,
        }),
      };
    } catch {
      return { __html: previewLatex || "latex error" };
    }
  };

  return (
    <NodeViewWrapper className={`math-block my-4 relative group ${selected ? "ring-2 ring-primary rounded-lg p-1" : ""}`}>
      {isEditing ? (
        <div className="bg-muted/50 rounded-lg border-2 border-primary/50 overflow-hidden transition-all duration-200">
          <div className="flex items-center justify-between px-3 py-1.5 bg-muted border-b border-primary/20 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <Code2 className="h-3.5 w-3.5 text-primary" />
              <span>Editar LaTeX</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleCancel}
                className="hover:text-destructive transition-colors p-1"
                title="Cancelar (Esc)"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <button 
                onClick={handleSave}
                className="hover:text-primary transition-colors p-1 bg-primary/10 rounded"
                title="Salvar (Ctrl+Enter)"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <TextareaAutosize
            ref={textareaRef}
            className="w-full bg-transparent p-4 outline-none font-mono text-sm resize-none"
            placeholder="Digite seu LaTeX aqui... Ex: e^{i\pi} + 1 = 0"
            value={latex}
            onChange={(e) => setLatex(e.target.value)}
            onKeyDown={handleKeyDown}
            minRows={2}
          />
          <div className="px-4 py-3 bg-background/50 border-t border-muted-foreground/10 opacity-70">
            <div className="text-[10px] text-muted-foreground mb-1 font-semibold uppercase tracking-widest">Preview</div>
            <div 
              className="flex justify-center"
              dangerouslySetInnerHTML={renderedHtml()}
            />
          </div>
        </div>
      ) : (
        <div
          className="math-block-container py-6 px-4 rounded-lg bg-muted/20 border border-transparent hover:border-primary/30 transition-all cursor-pointer flex flex-col items-center gap-2"
          onClick={handleToggleEdit}
        >
          <div dangerouslySetInnerHTML={renderedHtml()} />
          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 p-1 bg-background/80 rounded-md border text-[10px] text-muted-foreground font-medium flex items-center gap-1">
             <Sigma className="h-3 w-3" /> LaTeX
          </div>
        </div>
      )}
    </NodeViewWrapper>
  );
}
