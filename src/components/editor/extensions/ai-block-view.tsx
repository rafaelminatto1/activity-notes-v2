"use client";

import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { Sparkles, Check, X, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { AIBlockStatus } from "./ai-block";

export function AIBlockView({ node, deleteNode, editor }: NodeViewProps) {
  const status = node.attrs.status as AIBlockStatus;
  const result = node.attrs.result as string;
  const action = node.attrs.action as string;

  function handleAccept() {
    if (!editor) return;
    const pos = editor.state.selection.from;
    deleteNode();
    editor.chain().focus().insertContentAt(pos, result).run();
  }

  function handleDiscard() {
    deleteNode();
  }

  function handleRetry() {
    // Re-trigger the AI action by dispatching a custom event
    const event = new CustomEvent("ai-block-retry", {
      detail: { action, nodePos: editor.state.selection.from },
    });
    window.dispatchEvent(event);
  }

  if (status === "loading") {
    return (
      <NodeViewWrapper className="ai-block my-3 rounded-md border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-700 dark:bg-emerald-950/30" contentEditable={false}>
        <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
          <Sparkles className="h-4 w-4 animate-pulse" />
          <span>IA gerando conteúdo...</span>
        </div>
        <div className="mt-3 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </NodeViewWrapper>
    );
  }

  if (status === "error") {
    return (
      <NodeViewWrapper className="ai-block my-3 rounded-md border border-red-300 bg-red-50 p-4 dark:border-red-700 dark:bg-red-950/30" contentEditable={false}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <X className="h-4 w-4" />
            <span>Erro ao gerar conteúdo</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleRetry} className="h-7 text-xs">
              <RefreshCw className="mr-1 h-3 w-3" />
              Tentar novamente
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDiscard} className="h-7 text-xs">
              Remover
            </Button>
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  // status === "done"
  return (
    <NodeViewWrapper className="ai-block my-3 rounded-md border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-700 dark:bg-emerald-950/30" contentEditable={false}>
      <div className="mb-2 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
        <Sparkles className="h-3.5 w-3.5" />
        <span>Gerado por IA</span>
      </div>
      <div className="mb-3 whitespace-pre-wrap text-sm">{result}</div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleAccept} className="h-7 text-xs">
          <Check className="mr-1 h-3 w-3" />
          Aceitar
        </Button>
        <Button size="sm" variant="outline" onClick={handleDiscard} className="h-7 text-xs">
          <X className="mr-1 h-3 w-3" />
          Descartar
        </Button>
      </div>
    </NodeViewWrapper>
  );
}
