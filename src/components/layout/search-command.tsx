"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FileText, Search, Sparkles } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useSearchStore } from "@/stores/search-store";
import { useSearch } from "@/hooks/use-search";
import { Spinner } from "@/components/ui/spinner";
import { useSidebarStore } from "@/stores/sidebar-store";
import { searchSimilarDocuments } from "@/lib/firebase/embeddings";
import { useAuth } from "@/hooks/use-auth";
import type { Document } from "@/types/document";
import { cn } from "@/lib/utils";

export function SearchCommand() {
  const router = useRouter();
  const { user } = useAuth();
  const { isOpen, close } = useSearchStore();
  const { results: textResults, loading: textLoading, search, clear } = useSearch();
  const closeMobile = useSidebarStore((s) => s.closeMobile);
  const [query, setQuery] = useState("");
  
  // Semantic Search State
  const [semanticResults, setSemanticResults] = useState<Document[]>([]);
  const [semanticLoading, setSemanticLoading] = useState(false);
  const [showSemantic, setShowSemantic] = useState(false);

  const isQuestion = query.trim().endsWith("?") || 
    /^(quem|onde|como|qual|por que|oq|o que|who|where|how|what|why)/i.test(query.trim());

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value);
      setShowSemantic(false);
      if (value.trim().length >= 2) {
        search(value);
      } else {
        clear();
        setSemanticResults([]);
      }
    },
    [search, clear]
  );

  const handleSemanticSearch = async () => {
    if (!user || query.trim().length < 3) return;
    
    setShowSemantic(true);
    setSemanticLoading(true);
    try {
      const docs = await searchSimilarDocuments(user.uid, query);
      setSemanticResults(docs);
    } catch (error) {
      console.error(error);
    } finally {
      setSemanticLoading(false);
    }
  };

  function handleSelect(documentId: string) {
    close();
    closeMobile();
    setQuery("");
    clear();
    setSemanticResults([]);
    setShowSemantic(false);
    router.push(`/documents/${documentId}`);
  }

  // Limpar ao fechar
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      clear();
      setSemanticResults([]);
      setShowSemantic(false);
    }
  }, [isOpen, clear]);

  const isLoading = textLoading || semanticLoading;

  return (
    <CommandDialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <CommandInput
        placeholder="Buscar documentos..."
        value={query}
        onValueChange={handleSearch}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && textResults.length === 0) {
             handleSemanticSearch();
          }
        }}
      />
      <CommandList>
        {isLoading && (
          <div className="flex items-center justify-center py-6">
            <Spinner className="h-5 w-5" />
          </div>
        )}

        {!isLoading && query.trim().length >= 2 && (
          <CommandGroup>
            <CommandItem
              value="ask-ai-trigger"
              onSelect={handleSemanticSearch}
              className={cn(
                "cursor-pointer",
                isQuestion 
                  ? "text-purple-600 dark:text-purple-400 font-medium" 
                  : "text-emerald-600 dark:text-emerald-400"
              )}
            >
              <Sparkles className={cn("mr-2 h-4 w-4", isQuestion && "fill-current")} />
              Perguntar à IA: "{query}"
              {isQuestion && <span className="ml-2 text-xs opacity-70">(Recomendado)</span>}
            </CommandItem>
          </CommandGroup>
        )}

        <CommandSeparator />

        {showSemantic && semanticResults.length > 0 && (
          <CommandGroup heading="Resultados Semânticos (IA)">
            {semanticResults.map((doc) => (
              <CommandItem
                key={`semantic-${doc.id}`}
                value={`sem-${doc.title}-${doc.id}`}
                onSelect={() => handleSelect(doc.id)}
                className="cursor-pointer"
              >
                <Sparkles className="mr-2 h-3.5 w-3.5 text-purple-500" />
                <span className="truncate">{doc.title || "Sem título"}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {textResults.length > 0 && (
          <CommandGroup heading="Correspondência Exata">
            {textResults.map((doc) => (
              <CommandItem
                key={doc.id}
                value={`${doc.title} ${doc.id}`}
                onSelect={() => handleSelect(doc.id)}
                className="cursor-pointer"
              >
                {doc.icon ? (
                  <span className="mr-2 text-sm">{doc.icon}</span>
                ) : (
                  <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                )}
                <span className="truncate">
                  {doc.title || "Sem título"}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {!isLoading && query.trim().length >= 2 && textResults.length === 0 && !showSemantic && (
          <CommandEmpty>
            <div className="flex flex-col items-center gap-2 py-4">
              <Search className="h-8 w-8 text-muted-foreground" />
              <p>Sem resultados exatos. Tente perguntar à IA.</p>
            </div>
          </CommandEmpty>
        )}
      </CommandList>
    </CommandDialog>
  );
}
