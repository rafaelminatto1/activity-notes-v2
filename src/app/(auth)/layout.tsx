"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Spinner } from "@/components/ui/spinner";
import { FileText } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/documents");
    }
  }, [loading, user, router]);

  if (loading || user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen">
      {/* Gradiente sutil de background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-background via-background to-muted/50" />

      {/* Coluna esquerda — Formulário */}
      <div className="relative z-10 flex w-full items-center justify-center px-4 py-12 lg:w-1/2">
        {children}
      </div>

      {/* Coluna direita — Ilustração / Marketing (apenas desktop) */}
      <div className="relative z-10 hidden w-1/2 items-center justify-center bg-muted/30 lg:flex">
        <div className="max-w-md space-y-6 px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <FileText className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold tracking-tight">
              Activity Notes
            </span>
          </div>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Organize suas ideias, documente seus projetos e potencialize sua
            produtividade com inteligência artificial.
          </p>
          <div className="space-y-4 pt-4">
            <Feature text="Editor poderoso com blocos e atalhos" />
            <Feature text="IA integrada para resumir, expandir e traduzir" />
            <Feature text="Organização hierárquica de documentos" />
            <Feature text="Tema claro e escuro" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-2 w-2 shrink-0 rounded-full bg-primary" />
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
  );
}
