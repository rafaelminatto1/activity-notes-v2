"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PlusCircle, FileText, Sparkles, Layout, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { createDocument, getDocument } from "@/lib/firebase/firestore";
import { toast } from "sonner";
import type { Document } from "@/types/document";

export default function DocumentsPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [recentDocs, setRecentDocs] = useState<Document[]>([]);
  const [loadingRecents, setLoadingRecents] = useState(true);

  // Carregar documentos recentes do userProfile (denormalizados)
  useEffect(() => {
    async function loadRecents() {
      const ids = userProfile?.recentDocIds ?? [];
      if (ids.length === 0) {
        setRecentDocs([]);
        setLoadingRecents(false);
        return;
      }
      const docs = await Promise.all(ids.slice(0, 8).map((id) => getDocument(id)));
      setRecentDocs(docs.filter((d): d is Document => d !== null && !d.isArchived));
      setLoadingRecents(false);
    }
    loadRecents();
  }, [userProfile?.recentDocIds]);

  async function handleCreate() {
    if (!user) return;
    try {
      const docId = await createDocument(user.uid);
      router.push(`/documents/${docId}`);
    } catch {
      toast.error("Falha ao criar documento.");
    }
  }

  const displayName = userProfile?.displayName || user?.displayName || "";
  const firstName = displayName.split(" ")[0] || "";
  const greeting = getGreeting();

  return (
    <div className="mx-auto max-w-3xl px-8 py-12">
      {/* Welcome */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold">
          {greeting}{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="mt-1 text-muted-foreground">
          O que você gostaria de fazer hoje?
        </p>
      </div>

      {/* Quick Action Cards */}
      <div className="mb-10 grid gap-3 sm:grid-cols-3">
        <ActionCard
          icon={<PlusCircle className="h-5 w-5" />}
          title="Nova página"
          description="Criar documento em branco"
          onClick={handleCreate}
        />
        <ActionCard
          icon={<Layout className="h-5 w-5" />}
          title="Templates"
          description="Começar com um modelo"
          onClick={() => toast.info("Templates serão implementados em breve.")}
          disabled
        />
        <ActionCard
          icon={<Sparkles className="h-5 w-5" />}
          title="Assistente IA"
          description="Criar com inteligência artificial"
          onClick={() => toast.info("Assistente IA será implementado em breve.")}
          disabled
        />
      </div>

      {/* Recent Documents */}
      <div>
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Clock className="h-4 w-4" />
          Recentes
        </div>

        {loadingRecents ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : recentDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
            <FileText className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Nenhum documento recente
            </p>
            <Button variant="link" size="sm" className="mt-1" onClick={handleCreate}>
              Criar seu primeiro documento
            </Button>
          </div>
        ) : (
          <div className="space-y-0.5">
            {recentDocs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => router.push(`/documents/${doc.id}`)}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
              >
                {doc.icon ? (
                  <span className="text-base">{doc.icon}</span>
                ) : (
                  <FileText className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="truncate font-medium">
                  {doc.title || "Sem título"}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ActionCard({
  icon,
  title,
  description,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col gap-2 rounded-lg border p-4 text-left transition-colors hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}
