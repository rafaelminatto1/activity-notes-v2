"use client";

import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { Info, AlertTriangle, XCircle, CheckCircle } from "lucide-react";
import type { CalloutType } from "./callout";

const calloutConfig: Record<CalloutType, { icon: React.ElementType; className: string }> = {
  info: {
    icon: Info,
    className: "border-l-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  },
  warning: {
    icon: AlertTriangle,
    className: "border-l-yellow-500 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  },
  error: {
    icon: XCircle,
    className: "border-l-red-500 bg-red-500/10 text-red-700 dark:text-red-400",
  },
  success: {
    icon: CheckCircle,
    className: "border-l-green-500 bg-green-500/10 text-green-700 dark:text-green-400",
  },
};

const typeLabels: Record<CalloutType, string> = {
  info: "Info",
  warning: "Aviso",
  error: "Erro",
  success: "Sucesso",
};

export function CalloutView({ node, updateAttributes }: NodeViewProps) {
  const type = (node.attrs.type as CalloutType) || "info";
  const config = calloutConfig[type];
  const Icon = config.icon;

  return (
    <NodeViewWrapper className={`callout-block my-3 rounded-md border-l-4 p-4 ${config.className}`}>
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0" />
        <select
          contentEditable={false}
          value={type}
          onChange={(e) => updateAttributes({ type: e.target.value })}
          className="bg-transparent text-xs font-medium uppercase tracking-wide outline-none cursor-pointer"
        >
          {(Object.keys(calloutConfig) as CalloutType[]).map((t) => (
            <option key={t} value={t}>
              {typeLabels[t]}
            </option>
          ))}
        </select>
      </div>
      <NodeViewContent className="callout-content min-h-[1em]" />
    </NodeViewWrapper>
  );
}
