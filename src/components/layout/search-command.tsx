"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  FileText, 
  Search, 
  CheckCircle2, 
  MessageSquare, 
  Clock,
  X
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useSearchStore } from "@/stores/search-store";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { searchClient, INDEX_NAME } from "@/lib/search/algolia-client";
import { InstantSearch, useInstantSearch, useSearchBox, useHits, Configure } from "react-instantsearch";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

// Tipos do Algolia
interface AlgoliaRecord {
  objectID: string;
  type: "document" | "task" | "comment";
  title?: string;
  content?: string;
  icon?: string;
  path?: string[]; 
  url: string;
  createdAt: number;
  status?: string; 
  userName?: string; 
  _highlightResult?: any;
}

// Componente para sincronizar query
function CustomSearchBox({ query, refine }: { query: string; refine: (value: string) => void }) {
  useEffect(() => {
    refine(query);
  }, [query, refine]);
  return null;
}

// Componente para exibir Highlighting seguro
function Highlight({ attribute, hit, className }: { attribute: string, hit: any, className?: string }) {
  const highlightResult = hit._highlightResult?.[attribute];
  
  if (!highlightResult) {
    return <span className={className}>{hit[attribute]}</span>;
  }

  return (
    <span 
      className={className}
      dangerouslySetInnerHTML={{ __html: highlightResult.value }} 
    />
  );
}

function SearchResults({ onSelect }: { onSelect: (url: string) => void }) {
  const { hits } = useHits<AlgoliaRecord>();
  const { status } = useInstantSearch();
  const isLoading = status === 'loading' || status === 'stalled';

  // Grouping
  const groupedHits = useMemo(() => {
    const groups: Record<string, AlgoliaRecord[]> = {
      document: [],
      task: [],
      comment: []
    };
    hits.forEach(hit => {
      if (groups[hit.type]) {
        groups[hit.type].push(hit);
      } else {
        if (!groups['other']) groups['other'] = [];
        groups['other'].push(hit);
      }
    });
    return groups;
  }, [hits]);

  const hasResults = hits.length > 0;

  if (!hasResults && !isLoading) {
    return <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>;
  }

  return (
    <>
      {groupedHits.document?.length > 0 && (
        <CommandGroup heading="Documentos">
          {groupedHits.document.map((hit) => (
            <CommandItem
              key={hit.objectID}
              value={`doc-${hit.objectID}`}
              onSelect={() => onSelect(hit.url)}
              className="cursor-pointer"
            >
              <div className="flex items-center gap-3 w-full overflow-hidden">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted/50 shrink-0 text-lg">
                  {hit.icon || <FileText className="h-4 w-4 text-muted-foreground" />}
                </div>
                <div className="flex flex-col min-w-0">
                  <Highlight attribute="title" hit={hit} className="truncate font-medium text-sm" />
                  {hit.path && hit.path.length > 0 && (
                    <span className="text-[10px] text-muted-foreground truncate">
                      {hit.path.join(" > ")}
                    </span>
                  )}
                </div>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      )}

      {groupedHits.task?.length > 0 && (
        <>
          <CommandSeparator />
          <CommandGroup heading="Tarefas">
            {groupedHits.task.map((hit) => (
              <CommandItem
                key={hit.objectID}
                value={`task-${hit.objectID}`}
                onSelect={() => onSelect(hit.url)}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-3 w-full overflow-hidden">
                   <div className={cn(
                     "flex h-8 w-8 items-center justify-center rounded-md shrink-0",
                     hit.status === "done" ? "bg-green-100 dark:bg-green-900/30 text-green-600" : "bg-muted/50 text-muted-foreground"
                   )}>
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <Highlight attribute="title" hit={hit} className="truncate font-medium text-sm" />
                    <span className="text-[10px] text-muted-foreground truncate">
                       Tarefa
                    </span>
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </>
      )}

      {groupedHits.comment?.length > 0 && (
        <>
          <CommandSeparator />
          <CommandGroup heading="Comentários">
            {groupedHits.comment.map((hit) => (
              <CommandItem
                key={hit.objectID}
                value={`chat-${hit.objectID}`}
                onSelect={() => onSelect(hit.url)}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-3 w-full overflow-hidden">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600 shrink-0">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <Highlight attribute="content" hit={hit} className="truncate font-medium text-sm" />
                    <span className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                      {hit.userName} • {hit.createdAt ? formatDistanceToNow(hit.createdAt, { addSuffix: true, locale: ptBR }) : ""}
                    </span>
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </>
      )}
    </>
  );
}

function SearchContent({ 
  query, 
  onSelect, 
  recentSearches,
  onRecentSelect
}: { 
  query: string; 
  onSelect: (url: string) => void;
  recentSearches: string[];
  onRecentSelect: (term: string) => void;
}) {
  const { refine } = useSearchBox();
  
  return (
    <>
      <CustomSearchBox query={query} refine={refine} />
      {query ? (
         <SearchResults onSelect={onSelect} />
      ) : (
         recentSearches.length > 0 && (
          <CommandGroup heading="Recentes">
            {recentSearches.map((term, i) => (
              <CommandItem 
                key={`recent-${i}`} 
                value={`recent-${term}`} 
                onSelect={() => onRecentSelect(term)}
                className="cursor-pointer"
              >
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                {term}
              </CommandItem>
            ))}
          </CommandGroup>
         )
      )}
    </>
  );
}

function FilterButton({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon?: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors border",
        active 
          ? "bg-primary/10 text-primary border-primary/20" 
          : "bg-background text-muted-foreground border-transparent hover:bg-muted"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

export function SearchCommand() {
  const router = useRouter();
  const { isOpen, close } = useSearchStore();
  const closeMobile = useSidebarStore((s) => s.closeMobile);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  useEffect(() => {
    const saved = localStorage.getItem("recent_searches");
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const saveToHistory = (term: string) => {
    if (!term.trim()) return;
    const newHistory = [term, ...recentSearches.filter(t => t !== term)].slice(0, 5);
    setRecentSearches(newHistory);
    localStorage.setItem("recent_searches", JSON.stringify(newHistory));
  };

  const handleSelect = (url: string) => {
    if (query) saveToHistory(query);
    close();
    closeMobile();
    router.push(url);
    setTimeout(() => setQuery(""), 300);
  };

  return (
    <CommandDialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <div className="flex flex-col border-b">
        <div className="flex items-center px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <input
            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Buscar em todo o workspace..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery("")} className="ml-2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-1 px-3 pb-2 overflow-x-auto scrollbar-hide">
          <FilterButton 
            active={activeFilter === "all"} 
            onClick={() => setActiveFilter("all")} 
            label="Tudo" 
          />
          <FilterButton 
            active={activeFilter === "document"} 
            onClick={() => setActiveFilter("document")} 
            label="Documentos" 
            icon={<FileText className="h-3 w-3 mr-1" />}
          />
          <FilterButton 
            active={activeFilter === "task"} 
            onClick={() => setActiveFilter("task")} 
            label="Tarefas" 
            icon={<CheckCircle2 className="h-3 w-3 mr-1" />}
          />
          <FilterButton 
            active={activeFilter === "comment"} 
            onClick={() => setActiveFilter("comment")} 
            label="Comentários" 
            icon={<MessageSquare className="h-3 w-3 mr-1" />}
          />
        </div>
      </div>
      
      <CommandList className="max-h-[60vh]">
        <InstantSearch searchClient={searchClient} indexName={INDEX_NAME} future={{ preserveSharedStateOnUnmount: true }}>
          <Configure 
            hitsPerPage={20} 
            filters={activeFilter !== "all" ? `type:${activeFilter}` : undefined}
          />
          <SearchContent 
            query={query} 
            onSelect={handleSelect}
            recentSearches={recentSearches}
            onRecentSelect={(term) => setQuery(term)}
          />
        </InstantSearch>
      </CommandList>
    </CommandDialog>
  );
}
