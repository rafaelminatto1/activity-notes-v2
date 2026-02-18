"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Paperclip } from "lucide-react";
import { uploadImage } from "@/lib/firebase/storage";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/config";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import type { Editor } from "@tiptap/core";

interface FileUploaderProps {
  documentId: string;
  editor: Editor | null;
}

export function FileUploader({ documentId, editor }: FileUploaderProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    const toastId = toast.loading("Enviando e analisando arquivo...");

    try {
      // 1. Upload para Firebase Storage (reusing image upload for generic files for MVP)
      // Idealmente, criar bucket separado para documentos
      const downloadURL = await uploadImage(file, user.uid, "documents", () => {
        // toast.loading(`Enviando... ${progress}%`, { id: toastId });
      });

      // 2. Analisar com Gemini
      if (!functions) throw new Error("Firebase functions not initialized");
      const analyzePDF = httpsCallable(functions, "analyzePDFDocument");
      
      // Nota: Passamos a URL. O backend precisará saber lidar com essa URL
      // Se a função backend espera 'gs://', precisamos converter ou baixar.
      // O código atual do backend tenta ler a string. Vamos confiar que vamos melhorar o backend logo.
      
      const result = await analyzePDF({ documentRef: downloadURL, documentId });
      const data = (
        result.data as {
          data: {
            summary: string;
            topics?: string[];
            actionItems?: Array<{ text: string; due?: string }>;
          };
        }
      ).data;

      // 3. Inserir Insights no Editor
      if (editor) {
        editor.chain().focus().insertContent(`
          <div data-type="callout" class="bg-muted p-4 rounded-lg my-4 border-l-4 border-emerald-500">
            <div class="flex items-center gap-2 font-bold mb-2 text-emerald-700">
              <span class="icon">📄</span> Análise de Arquivo: ${file.name}
            </div>
            <p><strong>Resumo:</strong> ${data.summary}</p>
            <p><strong>Tópicos:</strong> ${data.topics?.join(", ")}</p>
            ${data.actionItems?.length ? `
              <p><strong>Ações:</strong></p>
              <ul>
                ${data.actionItems.map((item) => `<li>${item.text} (Prazo: ${item.due || 'N/A'})</li>`).join('')}
              </ul>
            ` : ''}
          </div>
        `).run();
      }

      toast.success("Arquivo analisado e inserido!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Erro ao processar arquivo.", { id: toastId });
    } finally {
      setIsUploading(false);
      e.target.value = ""; // Reset input
    }
  };

  return (
    <div className="relative">
      <input
        type="file"
        id="file-upload"
        className="hidden"
        accept=".pdf,.txt,.md,.csv" // Focar em textos por enquanto
        onChange={handleFileUpload}
        disabled={isUploading}
      />
      <Button
        variant="ghost"
        size="sm"
        disabled={isUploading}
        className="w-full justify-start gap-2 h-8"
        onClick={() => document.getElementById("file-upload")?.click()}
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Paperclip className="h-4 w-4" />
        )}
        <span className="text-xs">Anexar e Analisar PDF</span>
      </Button>
    </div>
  );
}
