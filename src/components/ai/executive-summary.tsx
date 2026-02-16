"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, FileText, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/config";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/stores/editor-store";
import { updateDocument } from "@/lib/firebase/firestore";

interface ExecutiveSummaryProps {
  documentId: string;
  summary?: string;
  content: string;
}

export function ExecutiveSummary({ documentId, summary: initialSummary, content }: ExecutiveSummaryProps) {
  const [summary, setSummary] = useState(initialSummary);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const { setSaving, setSaved } = useEditorStore();

  const handleGenerateSummary = async () => {
    if (!content || content.length < 100) {
      toast.error("O documento é muito curto para gerar um resumo.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Gerando resumo executivo...");

    try {
      if (!functions) throw new Error("Firebase functions not initialized");
      const generateSummary = httpsCallable(functions, "genkitGenerateSummary");
      const result = await generateSummary({
        text: content,
        documentId, // This will automatically update Firestore too if flow is configured
      });

      const data = (result.data as any).data;
      setSummary(data.summary);
      
      // If the cloud function didn't update (safety check), we update manually
      if (!data.saved) {
        setSaving();
        await updateDocument(documentId, { summary: data.summary });
        setSaved();
      }

      toast.success("Resumo gerado!", { id: toastId });
      setIsExpanded(true);
    } catch (error) {
      console.error("Summary error:", error);
      toast.error("Erro ao gerar resumo.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (!summary && !loading && (!content || content.length < 100)) return null;

  return (
    <div className="mb-8 mx-auto max-w-6xl px-4">
      {!summary ? (
        <Button
          variant="outline"
          className="w-full h-auto py-4 border-dashed border-2 text-muted-foreground hover:text-emerald-600 hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all group"
          onClick={handleGenerateSummary}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          ) : (
            <Sparkles className="h-5 w-5 mr-2 group-hover:text-emerald-500" />
          )}
          {loading ? "Gerando resumo..." : "Gerar Resumo Executivo com IA"}
        </Button>
      ) : (
        <div className="bg-muted/30 border rounded-lg overflow-hidden">
          <div 
            className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              <FileText className="h-4 w-4" />
              Resumo Executivo
            </div>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
          
          {isExpanded && (
            <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2 duration-200">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {summary}
              </p>
              <div className="mt-2 flex justify-end">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGenerateSummary();
                  }}
                  disabled={loading}
                  className="text-xs h-7 text-muted-foreground hover:text-emerald-600"
                >
                  {loading ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Sparkles className="h-3 w-3 mr-1" />
                  )}
                  Regerar
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
