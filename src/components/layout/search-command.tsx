"use client";

import Fuse from "fuse.js";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Search,
  CheckCircle2,
  MessageSquare,
  Clock,
  X,
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
import { trackSearchPerformed } from "@/lib/firebase/analytics";
import {
  subscribeToRealtimeSearchIndex,
  type RealtimeSearchRecord,
} from "@/lib/search/realtime-search";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

type SearchFilter = "all" | "document" | "task" | "comment";

function readRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const value = window.localStorage.getItem("recent_searches");
    return value ? (JSON.parse(value) as string[]) : [];
  } catch {
    return [];
  }
}

function SearchResults({
  hits,
  onSelect,
  isLoading,
}: {
  hits: RealtimeSearchRecord[];
  onSelect: (url: string) => void;
  isLoading: boolean;
}) {
  const hasResults = hits.length > 0;

  // Grouping
  const groupedHits = useMemo(() => {
    const groups: Record<string, RealtimeSearchRecord[]> = {
      document: [],
      task: [],
      comment: [],
    };
    hits.forEach((hit) => {
      if (groups[hit.type]) {
        groups[hit.type].push(hit);
      }
    });
    return groups;
  }, [hits]);

  if (!hasResults && isLoading) {
    return <CommandEmpty>Atualizando índice de busca...</CommandEmpty>;
  }

  if (!hasResults) {
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
                  <span className="truncate font-medium text-sm">
                    {hit.title || "Sem título"}
                  </span>
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
                    <span className="truncate font-medium text-sm">
                      {hit.title || "Sem título"}
                    </span>
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
                    <span className="truncate font-medium text-sm">
                      {hit.content || "Sem conteúdo"}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                      {hit.userName || "Usuário"} •{" "}
                      {hit.createdAt
                        ? formatDistanceToNow(hit.createdAt, {
                            addSuffix: true,
                            locale: ptBR,
                          })
                        : "agora"}
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

function FilterButton({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
}) {
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
  const { user, ready } = useAuth();
  const { isOpen, close } = useSearchStore();
  const closeMobile = useSidebarStore((s) => s.closeMobile);

  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<SearchFilter>("all");
  const [recentSearches, setRecentSearches] =
    useState<string[]>(readRecentSearches);
  const [records, setRecords] = useState<RealtimeSearchRecord[]>([]);
  const [isIndexReady, setIsIndexReady] = useState(false);

  useEffect(() => {
    if (!ready || !user) return;
    return subscribeToRealtimeSearchIndex(user.uid, (state) => {
      setRecords(state.records);
      setIsIndexReady(state.isReady);
    });
  }, [ready, user]);

  const indexedRecords = useMemo(
    () => (ready && user ? records : []),
    [ready, user, records]
  );
  const indexReady = ready && user ? isIndexReady : true;

  const fuse = useMemo(() => {
    return new Fuse(indexedRecords, {
      includeScore: true,
      threshold: 0.35,
      ignoreLocation: true,
      minMatchCharLength: 2,
      keys: [
        { name: "title", weight: 0.45 },
        { name: "content", weight: 0.3 },
        { name: "pathText", weight: 0.1 },
        { name: "status", weight: 0.1 },
        { name: "userName", weight: 0.05 },
      ],
    });
  }, [indexedRecords]);

  const results = useMemo(() => {
    const term = query.trim();
    if (!term) return [];

    const matched = fuse.search(term, { limit: 50 }).map((result) => result.item);
    if (activeFilter === "all") return matched;
    return matched.filter((result) => result.type === activeFilter);
  }, [query, fuse, activeFilter]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) return;
    const timeoutId = window.setTimeout(() => {
      trackSearchPerformed();
    }, 400);
    return () => window.clearTimeout(timeoutId);
  }, [query]);

  const saveToHistory = (term: string) => {
    if (!term.trim()) return;
    const newHistory = [term, ...recentSearches.filter((t) => t !== term)].slice(0, 5);
    setRecentSearches(newHistory);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("recent_searches", JSON.stringify(newHistory));
    }
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
        {query ? (
          <SearchResults
            hits={results}
            isLoading={!indexReady}
            onSelect={handleSelect}
          />
        ) : recentSearches.length > 0 ? (
          <CommandGroup heading="Recentes">
            {recentSearches.map((term, i) => (
              <CommandItem
                key={`recent-${i}`}
                value={`recent-${term}`}
                onSelect={() => setQuery(term)}
                className="cursor-pointer"
              >
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                {term}
              </CommandItem>
            ))}
          </CommandGroup>
        ) : (
          <CommandEmpty>
            Digite para buscar documentos, tarefas e comentários.
          </CommandEmpty>
        )}
      </CommandList>
    </CommandDialog>
  );
}
