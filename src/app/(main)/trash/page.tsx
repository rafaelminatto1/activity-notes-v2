"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Undo2, FileText, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  getArchivedDocuments,
  restoreDocument,
  deleteDocumentPermanently,
} from "@/lib/firebase/firestore";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Document } from "@/types/document";
import { toast } from "sonner";

export default function TrashPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getArchivedDocuments(user.uid)
      .then(setDocuments)
      .finally(() => setLoading(false));
  }, [user]);

  async function handleRestore(docId: string) {
    try {
      await restoreDocument(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      toast.success("Documento restaurado.");
    } catch {
      toast.error("Falha ao restaurar documento.");
    }
  }

  async function handleDelete(docId: string) {
    try {
      await deleteDocumentPermanently(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      toast.success("Documento excluído permanentemente.");
    } catch {
      toast.error("Falha ao excluir documento.");
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-2 p-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Trash2 className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Lixeira</h1>
      </div>

      {/* 30-day warning banner */}
      <div className="mb-6 flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm">
        <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-400" />
        <span className="text-yellow-700 dark:text-yellow-400">
          Itens na lixeira são deletados permanentemente após 30 dias.
        </span>
      </div>

      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <Trash2 className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            A lixeira está vazia.
          </p>
          <Button
            variant="link"
            size="sm"
            className="mt-1"
            onClick={() => router.push("/documents")}
          >
            Voltar para documentos
          </Button>
        </div>
      ) : (
        <div className="space-y-0.5">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-accent transition-colors"
            >
              <span className="flex items-center gap-2 truncate min-w-0">
                {doc.icon ? (
                  <span className="text-base shrink-0">{doc.icon}</span>
                ) : (
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span className="truncate text-sm font-medium">
                  {doc.title || "Sem título"}
                </span>
              </span>

              <div className="flex items-center gap-1 shrink-0 ml-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => handleRestore(doc.id)}
                >
                  <Undo2 className="mr-1 h-3.5 w-3.5" />
                  Restaurar
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-destructive hover:text-destructive"
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir permanentemente?</AlertDialogTitle>
                      <AlertDialogDescription>
                        O documento{" "}
                        <span className="font-medium text-foreground">
                          &ldquo;{doc.title || "Sem título"}&rdquo;
                        </span>{" "}
                        e todos os seus sub-documentos serão excluídos
                        permanentemente. Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(doc.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Excluir permanentemente
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
