"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, FileText, Loader2 } from "lucide-react";
import { ContentRenderer } from "@/components/editor/content-renderer";
import { useAuth } from "@/hooks/use-auth";
import { getDocument } from "@/lib/firebase/firestore";
import type { Document } from "@/types/document";

interface PreviewClientProps {
  documentId: string;
}

export function PreviewClient({ documentId }: PreviewClientProps) {
  const { user, loading: authLoading } = useAuth();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const doc = await getDocument(documentId);
        if (cancelled) return;
        const canRead = !!doc && (doc.isPublished || (user && doc.userId === user.uid));
        setDocument(canRead ? doc : null);
      } catch {
        if (!cancelled) setDocument(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [documentId, user, authLoading]);

  if (loading || authLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <PreviewHeader />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Carregando documento...</p>
        </div>
        <PreviewFooter />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex min-h-screen flex-col">
        <PreviewHeader />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
          <FileText className="h-12 w-12 text-muted-foreground" />
          <h1 className="text-xl font-medium">Documento não encontrado</h1>
          <p className="text-muted-foreground text-center">
            Este documento não existe ou não está publicado.
          </p>
        </div>
        <PreviewFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <PreviewHeader />

      <main className="flex-1">
        {document.coverImage && (
          <div className="relative h-[35vh] w-full overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={document.coverImage}
              alt=""
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
          </div>
        )}

        <article className="mx-auto max-w-3xl px-6 py-10 sm:px-8">
          <header className="mb-8 space-y-3">
            {document.icon && (
              <span className="text-5xl block">{document.icon}</span>
            )}
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              {document.title || "Sem título"}
            </h1>
          </header>

          <div className="prose dark:prose-invert max-w-none">
            <ContentRenderer content={document.content} />
          </div>
        </article>
      </main>

      <PreviewFooter />
    </div>
  );
}

function PreviewHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-6 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold text-foreground hover:opacity-80 transition-opacity"
        >
          <FileText className="h-4 w-4" />
          Activity Notes
        </Link>
        <Link
          href="/register"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Criar conta
        </Link>
      </div>
    </header>
  );
}

function PreviewFooter() {
  return (
    <footer className="border-t py-8">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 px-6 sm:px-8">
        <p className="text-sm text-muted-foreground">
          Publicado com{" "}
          <Link
            href="/"
            className="font-medium text-foreground hover:underline"
          >
            Activity Notes
          </Link>
        </p>
        <Link
          href="/register"
          className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Crie com Activity Notes
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </footer>
  );
}
