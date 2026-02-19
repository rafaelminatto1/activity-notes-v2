"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, LayoutDashboard, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { subscribeToCanvasDocuments, subscribeToProjectCanvases, createDocument } from "@/lib/firebase/firestore";
import { subscribeToMemberProjects } from "@/lib/firebase/projects";
import { toast } from "sonner";
import type { Document } from "@/types/document";
import type { Project } from "@/types/project";

function formatUpdatedAt(document: Document) {
  const updatedAt = document.updatedAt?.toDate?.();
  if (!updatedAt) return "agora";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(updatedAt);
}

type CanvasCardProps = {
  canvas: Document;
  subtitle?: string;
  onClick: () => void;
};

function CanvasCard({ canvas, subtitle, onClick }: CanvasCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex h-36 flex-col justify-between rounded-lg border p-4 text-left hover:bg-accent transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="truncate">
          <p className="truncate text-base font-semibold">
            {canvas.title || "Sem título"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {subtitle || "Canvas visual"}
          </p>
        </div>
        <LayoutDashboard className="h-5 w-5 shrink-0 text-primary/70" />
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        <span>Atualizado em {formatUpdatedAt(canvas)}</span>
      </div>
    </button>
  );
}

export default function CanvasPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [canvases, setCanvases] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharedProjects, setSharedProjects] = useState<Project[]>([]);
  const [sharedLoading, setSharedLoading] = useState(true);
  const [sharedCanvasesByProject, setSharedCanvasesByProject] = useState<
    Record<string, Document[]>
  >({});

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToCanvasDocuments(user.uid, (docs) => {
      setCanvases(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToMemberProjects(user.uid, (projects) => {
      const filtered = projects.filter((project) => project.userId !== user.uid);
      setSharedProjects(filtered);
      setSharedLoading(false);
    });

    return () => {
      unsubscribe();
      setSharedProjects([]);
      setSharedLoading(true);
      setSharedCanvasesByProject({});
    };
  }, [user]);

  useEffect(() => {
    if (sharedProjects.length === 0) return;

    const unsubscribeFns = sharedProjects.map((project) =>
      subscribeToProjectCanvases(project.id, (docs) => {
        setSharedCanvasesByProject((prev) => ({
          ...prev,
          [project.id]: docs,
        }));
      })
    );

    return () => {
      unsubscribeFns.forEach((unsubscribe) => unsubscribe());
      setSharedCanvasesByProject({});
    };
  }, [sharedProjects]);

  const sharedCanvases = useMemo(
    () =>
      Object.values(sharedCanvasesByProject)
        .flat()
        .sort(
          (a, b) =>
            (b.updatedAt?.toMillis?.() ?? 0) - (a.updatedAt?.toMillis?.() ?? 0)
        ),
    [sharedCanvasesByProject]
  );

  const sharedProjectMap = useMemo(() => {
    const map = new Map<string, Project>();
    sharedProjects.forEach((project) => map.set(project.id, project));
    return map;
  }, [sharedProjects]);

  async function handleCreateCanvas() {
    if (!user) return;
    try {
      const docId = await createDocument(user.uid, { type: "canvas" });
      router.push(`/documents/${docId}`);
    } catch {
      toast.error("Falha ao criar canvas.");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Canvas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Crie mapas visuais com nós, conexões e links para notas.
          </p>
        </div>
        <Button onClick={handleCreateCanvas}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Canvas
        </Button>
      </div>

      <div className="space-y-10">
        <section>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <button
              onClick={handleCreateCanvas}
              className="flex h-36 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-accent transition-colors"
            >
              <PlusCircle className="h-8 w-8 text-muted-foreground" />
              <span className="font-medium text-muted-foreground">Criar Canvas</span>
            </button>

            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={`loading-${i}`} className="h-36 rounded-lg" />
              ))
            ) : canvases.length === 0 ? (
              <div className="col-span-full rounded-lg border border-dashed py-12 text-center">
                <LayoutDashboard className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Você ainda não criou nenhum canvas.
                </p>
              </div>
              ) : (
                canvases.map((canvas) => (
                  <CanvasCard
                    key={canvas.id}
                    canvas={canvas}
                    onClick={() => router.push(`/documents/${canvas.id}`)}
                  />
                ))
              )}
            </div>
          </section>

        {(sharedProjects.length > 0 || sharedLoading) && (
          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold">Canvas compartilhados</h2>
                <p className="text-sm text-muted-foreground">
                  Canvas de projetos em que você participa.
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sharedLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={`shared-loading-${i}`} className="h-36 rounded-lg" />
                ))
              ) : sharedCanvases.length === 0 ? (
                <div className="col-span-full rounded-lg border border-dashed py-12 text-center">
                  <LayoutDashboard className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    Ainda não há canvases disponíveis nos projetos compartilhados.
                  </p>
                </div>
              ) : (
                sharedCanvases.map((canvas) => (
                  <CanvasCard
                    key={canvas.id}
                    canvas={canvas}
                    subtitle={
                      sharedProjectMap.get(canvas.projectId ?? "")?.name ||
                      "Canvas compartilhado"
                    }
                    onClick={() => router.push(`/documents/${canvas.id}`)}
                  />
                ))
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
