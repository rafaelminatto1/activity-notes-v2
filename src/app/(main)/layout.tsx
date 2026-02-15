"use client";

import { useEffect, useCallback } from "react";
import { useRouter, usePathname, useParams } from "next/navigation";
import { Menu } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSettings } from "@/hooks/use-settings";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useSearchStore } from "@/stores/search-store";
import { useAIStore } from "@/stores/ai-store";
import { useTasksStore } from "@/stores/tasks-store";
import { createDocument } from "@/lib/firebase/firestore";
import { trackPageView } from "@/lib/firebase/analytics";
import { Sidebar, MobileSidebar } from "@/components/layout/sidebar";
import { SearchCommand } from "@/components/layout/search-command";
import { TasksPanel } from "@/components/smart/tasks-panel";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  useSettings();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const documentId = params.documentId as string | undefined;

  const toggleSidebar = useSidebarStore((s) => s.toggle);
  const toggleMobile = useSidebarStore((s) => s.toggleMobile);
  const openSearch = useSearchStore((s) => s.open);
  const toggleAIPanel = useAIStore((s) => s.togglePanel);
  
  const isTasksPanelOpen = useTasksStore((s) => s.isPanelOpen);
  const toggleTasksPanel = useTasksStore((s) => s.togglePanel);
  const closeTasksPanel = useTasksStore((s) => s.closePanel);

  const handleCreateDocument = useCallback(async () => {
    if (!user) return;
    try {
      const docId = await createDocument(user.uid);
      router.push(`/documents/${docId}`);
    } catch {
      toast.error("Falha ao criar documento.");
    }
  }, [user, router]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ctrl+K — Buscar
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        openSearch();
        return;
      }

      // Ctrl+\ — Toggle sidebar
      if (e.key === "\\" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      // Ctrl+N — Novo documento
      if (e.key === "n" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleCreateDocument();
        return;
      }

      // Ctrl+Shift+A — Assistente IA
      if (e.key === "A" && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault();
        toggleAIPanel();
        return;
      }

      // Ctrl+J — Toggle Tasks
      if (e.key === "j" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggleTasksPanel();
        return;
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [openSearch, toggleSidebar, handleCreateDocument, toggleAIPanel, toggleTasksPanel]);

  // Track page views
  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <MobileSidebar />

      <div className="flex flex-1 flex-col overflow-hidden relative">
        {/* Mobile header */}
        <div className="flex h-12 items-center border-b px-4 lg:hidden">
          <button
            onClick={toggleMobile}
            className="flex items-center justify-center rounded-md p-1.5 hover:bg-accent transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">{children}</main>

        {/* Tasks Panel Overlay/Sidebar */}
        {isTasksPanelOpen && (
           <div className="absolute top-0 right-0 h-full shadow-xl border-l z-20 bg-background w-80">
              <TasksPanel 
                isOpen={isTasksPanelOpen} 
                onClose={closeTasksPanel} 
                documentId={documentId}
              />
           </div>
        )}
      </div>

      <SearchCommand />
    </div>
  );
}
