"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <h2 className="text-xl font-semibold">Algo deu errado</h2>
      <p className="max-w-md text-center text-sm text-muted-foreground">
        {error.message || "Ocorreu um erro inesperado. Tente novamente."}
      </p>
      <Button onClick={reset}>Tentar novamente</Button>
    </div>
  );
}
