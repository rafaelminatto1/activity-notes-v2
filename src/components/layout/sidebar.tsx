"use client";

import { useRouter, useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronsLeft,
  Plus,
  Search,
  Settings,
  Sparkles,
  Star,
  Trash2,
  Menu,
  Mic,
  Network,
  Target,
  LayoutDashboard,
  Briefcase,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useSearchStore } from "@/stores/search-store";
import { useAIQAStore } from "@/stores/ai-qa-store";
import { createDocument, getDocument } from "@/lib/firebase/firestore";
import { useSpaceStore } from "@/stores/space-store";
import { Navigation } from "./navigation";
import { UserMenu } from "./user-menu";
import { HierarchyTree } from "./hierarchy-tree";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Inbox } from "./inbox";
import { TranscribeMeetingModal } from "@/components/shared/transcribe-meeting-modal";
import { toast } from "sonner";
import type { Document } from "@/types/document";

function SidebarContent() {
  const router = useRouter();
  const params = useParams();
  const { user, userProfile } = useAuth();
  const openSearch = useSearchStore((s) => s.open);
  const openQA = useAIQAStore((s) => s.open);
  const closeMobile = useSidebarStore((s) => s.closeMobile);
  const { spaces, initSubscription, cleanupSubscription, createSpace } = useSpaceStore();
  const [transcribeModalOpen, setTranscribeModalOpen] = useState(false);

  // Carregar espaços ao montar
  useEffect(() => {
    if (user?.uid) {
      initSubscription(user.uid);
    }
    return () => {
      cleanupSubscription();
    };
  }, [user, initSubscription, cleanupSubscription]);

  // Favorites — lidos do userProfile
  const [favoriteDocs, setFavoriteDocs] = useState<Document[]>([]);

  useEffect(() => {
    async function loadFavorites() {
      const ids = userProfile?.favoriteIds ?? [];
      if (ids.length === 0) {
        setFavoriteDocs([]);
        return;
      }
      const docs = await Promise.all(ids.map((id) => getDocument(id)));
      setFavoriteDocs(
        docs.filter((d): d is Document => d !== null && !d.isArchived)
      );
    }
    loadFavorites();
  }, [userProfile?.favoriteIds]);

  async function handleCreate(type: "document" | "canvas" = "document") {
    if (!user) return;
    try {
      const docId = await createDocument(user.uid, { type });
      router.push(`/documents/${docId}`);
      closeMobile();
    } catch {
      toast.error("Falha ao criar documento.");
    }
  }

  const handleCreateSpace = async () => {
    if (!user) return;
    const name = prompt("Nome do novo espaço:");
    if (name) {
      await createSpace(user.uid, name);
    }
  };

  function navigateTo(path: string) {
    router.push(path);
    closeMobile();
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-1">
          <UserMenu />
          <Inbox />
        </div>
        <button
          onClick={() => useSidebarStore.getState().toggle()}
          className="flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent transition-colors lg:flex hidden"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="space-y-0.5 px-2 py-1">
        <SidebarButton
          icon={<Home className="h-4 w-4" />}
          label="Início"
          onClick={() => navigateTo("/documents")}
        />
        <SidebarButton
          icon={<LayoutDashboard className="h-4 w-4" />}
          label="Dashboard"
          onClick={() => navigateTo("/dashboard")}
        />
        <SidebarButton
          icon={<Search className="h-4 w-4" />}
          label="Buscar"
          shortcut="Ctrl+K"
          onClick={openSearch}
        />
        <SidebarButton
          icon={<Mic className="h-4 w-4" />}
          label="Anotar Reunião"
          onClick={() => setTranscribeModalOpen(true)}
        />
        <SidebarButton
          icon={<Sparkles className="h-4 w-4" />}
          label="Perguntar às Notas"
          shortcut="Ctrl+Q"
          onClick={openQA}
        />
        <SidebarButton
          icon={<Briefcase className="h-4 w-4" />}
          label="Portfólios"
          onClick={() => navigateTo("/portfolios")}
        />
        <SidebarButton
          icon={<Network className="h-4 w-4" />}
          label="Mapa de Conexões"
          onClick={() => navigateTo("/graph")}
        />
        <SidebarButton
          icon={<Target className="h-4 w-4" />}
          label="Metas e OKRs"
          onClick={() => navigateTo("/goals")}
        />
        <SidebarButton
          icon={<Settings className="h-4 w-4" />}
          label="Configurações"
          onClick={() => navigateTo("/settings")}
        />
        <SidebarButton
          icon={<Plus className="h-4 w-4" />}
          label="Nova página"
          shortcut="Ctrl+N"
          onClick={() => handleCreate("document")}
        />
        <SidebarButton
          icon={<LayoutDashboard className="h-4 w-4" />}
          label="Novo Canvas"
          onClick={() => handleCreate("canvas")}
        />
        <SidebarButton
          icon={<Trash2 className="h-4 w-4" />}
          label="Lixeira"
          onClick={() => navigateTo("/trash")}
        />
      </div>

      <Separator className="mx-2 my-1" />

      {/* Scrollable area */}
      <ScrollArea className="flex-1 px-2">
        {/* Favorites */}
        {favoriteDocs.length > 0 && (
          <div className="py-1">
            <p className="mb-1 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Favoritos
            </p>
            <div className="space-y-0.5">
              {favoriteDocs.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => navigateTo(`/documents/${doc.id}`)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-sm px-3 py-1 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors",
                    params.documentId === doc.id && "bg-accent text-accent-foreground"
                  )}
                >
                  {doc.icon ? (
                    <span className="text-sm">{doc.icon}</span>
                  ) : (
                    <Star className="h-4 w-4 text-yellow-500" />
                  )}
                  <span className="truncate">{doc.title || "Sem título"}</span>
                </button>
              ))}
            </div>
            <Separator className="my-1" />
          </div>
        )}

        {/* Spaces Hierarchy */}
        <div className="py-1">
          <div className="flex items-center justify-between mb-1 px-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Espaços
            </p>
            <button
              onClick={handleCreateSpace}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <HierarchyTree spaces={spaces} />
          {spaces.length === 0 && (
            <div className="flex flex-col items-center justify-center py-4 text-center text-muted-foreground">
              <p className="text-xs">Nenhum espaço</p>
            </div>
          )}
        </div>

        {/* Pages (Legacy/Flat) */}
        <div className="py-1">
          <p className="mb-1 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Páginas Soltas
          </p>
          <Navigation />
        </div>

        <TranscribeMeetingModal
          open={transcribeModalOpen}
          onClose={() => setTranscribeModalOpen(false)}
        />
      </ScrollArea>

      {/* Bottom */}
      <Separator className="mx-2" />
      <div className="space-y-0.5 px-2 py-2">
      </div>
    </div>
  );
}

function SidebarButton({
  icon,
  label,
  shortcut,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-sm px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {shortcut && (
        <kbd className="ml-auto text-[10px] text-muted-foreground/60 hidden sm:inline">
          {shortcut}
        </kbd>
      )}
    </button>
  );
}

export function Sidebar() {
  const { isOpen, width, isResizing, setWidth, setIsResizing } =
    useSidebarStore();
  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);

      const startX = e.clientX;
      const startWidth = width;

      const handleMouseMove = (e: MouseEvent) => {
        const newWidth = startWidth + (e.clientX - startX);
        setWidth(newWidth);
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [width, setWidth, setIsResizing]
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        ref={sidebarRef}
        className={cn(
          "relative hidden h-full shrink-0 border-r bg-sidebar text-sidebar-foreground transition-[width] lg:block",
          isResizing && "transition-none select-none",
          !isOpen && "w-0 border-r-0 overflow-hidden"
        )}
        style={{ width: isOpen ? `${width}px` : 0 }}
      >
        <SidebarContent />

        {/* Resize handle */}
        {isOpen && (
          <div
            onMouseDown={handleMouseDown}
            className="absolute right-0 top-0 z-50 h-full w-1 cursor-col-resize hover:bg-primary/10 active:bg-primary/20"
          />
        )}
      </aside>

      {/* Collapsed toggle button (desktop) */}
      {!isOpen && (
        <button
          onClick={() => useSidebarStore.getState().open()}
          className="fixed left-4 top-4 z-40 hidden items-center justify-center rounded-md border bg-background p-2 shadow-sm hover:bg-accent transition-colors lg:flex"
        >
          <Menu className="h-4 w-4" />
        </button>
      )}
    </>
  );
}

export function MobileSidebar() {
  const { isMobileOpen, closeMobile } = useSidebarStore();

  if (!isMobileOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        onClick={closeMobile}
      />
      {/* Drawer */}
      <aside className="fixed inset-y-0 left-0 z-50 w-[280px] border-r bg-sidebar text-sidebar-foreground lg:hidden animate-slide-in-from-left">
        <SidebarContent />
      </aside>
    </>
  );
}
