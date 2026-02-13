"use client";

import { useMemo } from "react";
import { generateHTML } from "@tiptap/core";
import type { JSONContent } from "@tiptap/core";
import { getEditorExtensions } from "./extensions";

interface ContentRendererProps {
  content: JSONContent | null;
}

export function ContentRenderer({ content }: ContentRendererProps) {
  const html = useMemo(() => {
    if (!content) return "";
    try {
      return generateHTML(content, getEditorExtensions());
    } catch {
      return "<p>Erro ao renderizar conteúdo.</p>";
    }
  }, [content]);

  if (!content) {
    return (
      <p className="text-muted-foreground">
        Este documento não possui conteúdo.
      </p>
    );
  }

  return (
    <div
      className="tiptap-content prose prose-sm dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
