"use client";

import { useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSettings } from "@/hooks/use-settings";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useSearchStore } from "@/stores/search-store";
import { useAIStore } from "@/stores/ai-store";
import { createDocument } from "@/lib/firebase/firestore";
import { trackPageView } from "@/lib/firebase/analytics";
import { Sidebar, MobileSidebar } from "@/components/layout/sidebar";
import { SearchCommand } from "@/components/layout/search-command";
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
  const toggleSidebar = useSidebarStore((s) => s.toggle);
  const toggleMobile = useSidebarStore((s) => s.toggleMobile);
  const openSearch = useSearchStore((s) => s.open);
  const toggleAIPanel = useAIStore((s) => s.togglePanel);

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
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [openSearch, toggleSidebar, handleCreateDocument, toggleAIPanel]);

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

      <div className="flex flex-1 flex-col overflow-hidden">
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
      </div>

      <SearchCommand />
    </div>
  );
}
