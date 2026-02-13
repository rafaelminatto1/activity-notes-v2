"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FileText, Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useSearchStore } from "@/stores/search-store";
import { useSearch } from "@/hooks/use-search";
import { Spinner } from "@/components/ui/spinner";
import { useSidebarStore } from "@/stores/sidebar-store";

export function SearchCommand() {
  const router = useRouter();
  const { isOpen, close } = useSearchStore();
  const { results, loading, search, clear } = useSearch();
  const closeMobile = useSidebarStore((s) => s.closeMobile);
  const [query, setQuery] = useState("");

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value);
      if (value.trim().length >= 2) {
        search(value);
      } else {
        clear();
      }
    },
    [search, clear]
  );

  function handleSelect(documentId: string) {
    close();
    closeMobile();
    setQuery("");
    clear();
    router.push(`/documents/${documentId}`);
  }

  // Limpar ao fechar
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      clear();
    }
  }, [isOpen, clear]);

  return (
    <CommandDialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <CommandInput
        placeholder="Buscar documentos..."
        value={query}
        onValueChange={handleSearch}
      />
      <CommandList>
        {loading && (
          <div className="flex items-center justify-center py-6">
            <Spinner className="h-5 w-5" />
          </div>
        )}
        {!loading && query.trim().length >= 2 && results.length === 0 && (
          <CommandEmpty>
            <div className="flex flex-col items-center gap-2 py-4">
              <Search className="h-8 w-8 text-muted-foreground" />
              <p>Nenhum documento encontrado.</p>
            </div>
          </CommandEmpty>
        )}
        {!loading && query.trim().length < 2 && (
          <CommandEmpty>
            <p className="text-muted-foreground">
              Digite pelo menos 2 caracteres para buscar...
            </p>
          </CommandEmpty>
        )}
        {results.length > 0 && (
          <CommandGroup heading="Documentos">
            {results.map((doc) => (
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
      </CommandList>
    </CommandDialog>
  );
}
