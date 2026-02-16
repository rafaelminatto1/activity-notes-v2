"use client";

import { useState } from "react";
import { useContextualSidebar } from "@/hooks/use-contextual-sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { FileText, Lightbulb, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { FileUploader } from "./file-uploader";
import type { Editor } from "@tiptap/core";

interface ContextualSidebarProps {
  documentId: string;
  currentText: string;
  editor: Editor | null;
}

export function ContextualSidebar({ documentId, currentText, editor }: ContextualSidebarProps) {
  const [isOpen, setIsOpen] = useState(false); // Closed by default
  const { relatedDocs, loading } = useContextualSidebar(documentId, currentText);
  const router = useRouter();

  if (!isOpen) {
    return (
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40">
        <Button
          variant="secondary"
          size="sm"
          className="h-12 w-6 rounded-l-md rounded-r-none border-l border-t border-b shadow-md bg-background"
          onClick={() => setIsOpen(true)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-background border-l shadow-xl z-40 flex flex-col transition-all duration-300">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
          <Lightbulb className="h-4 w-4" />
          Notas Relacionadas
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="mb-4">
          <FileUploader documentId={documentId} editor={editor} />
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : relatedDocs.length === 0 ? (
          <div className="text-center text-muted-foreground py-10 text-sm">
            <p>Escreva mais para ver sugestões...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {relatedDocs.map((doc) => (
              <div
                key={doc.documentId}
                onClick={() => router.push(`/documents/${doc.documentId}`)}
                className="group relative flex flex-col gap-2 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-sm line-clamp-1">{doc.title}</span>
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {Math.round(doc.relevanceScore * 100)}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                  {doc.excerpt}
                </p>
                <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <FileText className="h-3 w-3 text-emerald-500" />
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
