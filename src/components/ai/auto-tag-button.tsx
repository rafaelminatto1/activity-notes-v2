"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tag, Loader2, Sparkles } from "lucide-react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/config";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AutoTagButtonProps {
  documentId: string;
  content: string;
}

export function AutoTagButton({ documentId, content }: AutoTagButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleAutoTag = async () => {
    if (!content || content.length < 50) {
      toast.error("O documento precisa ter mais conteúdo para gerar tags.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Gerando tags e categorias...");

    try {
      if (!functions) throw new Error("Firebase functions not initialized");
      const generateTags = httpsCallable(functions, "genkitGenerateTags");
      const result = await generateTags({
        text: content,
        documentId,
      });

      const data = (result.data as { data: { tags: string[] } }).data;
      
      toast.success(`Tags geradas: ${data.tags.join(", ")}`, { id: toastId });
    } catch (error) {
      console.error("Auto-tag error:", error);
      toast.error("Erro ao gerar tags.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAutoTag}
            disabled={loading}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-emerald-600"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <div className="relative">
                <Tag className="h-4 w-4" />
                <Sparkles className="h-2 w-2 absolute -top-1 -right-1 text-emerald-500" />
              </div>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Gerar tags automaticamente</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
