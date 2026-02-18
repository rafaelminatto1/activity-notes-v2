"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Scan, Loader2 } from "lucide-react";
import { uploadImage } from "@/lib/firebase/storage";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/config";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import type { Editor } from "@tiptap/core";

interface ScanButtonProps {
  editor: Editor;
}

export function ScanButton({ editor }: ScanButtonProps) {
  const { user } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsScanning(true);
    const toastId = toast.loading("Digitalizando imagem (OCR)...");

    try {
      // 1. Upload
      const downloadURL = await uploadImage(file, user.uid, "ocr-uploads");

      // 2. Call Cloud Vision (via Cloud Function)
      if (!functions) throw new Error("Firebase functions not initialized");
      const analyzeImage = httpsCallable(functions, "analyzeImageWithOCR");
      const result = await analyzeImage({ imageRef: downloadURL });
      const data = (result.data as { data: { text?: string } }).data;

      // 3. Insert Text
      if (data.text) {
        editor.chain().focus().insertContent(`
          <div data-type="callout" class="bg-muted p-4 rounded-lg my-4 border-l-4 border-blue-500">
            <div class="font-bold mb-2 text-blue-700">🔍 Texto Digitalizado</div>
            <p>${data.text.replace(/\n/g, '<br/>')}</p>
          </div>
        `).run();
        toast.success("Texto extraído com sucesso!", { id: toastId });
      } else {
        toast.warning("Nenhum texto encontrado na imagem.", { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro na digitalização.", { id: toastId });
    } finally {
      setIsScanning(false);
      e.target.value = "";
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        capture="environment" // Tenta abrir a câmera no mobile
        onChange={handleScan}
      />
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => fileInputRef.current?.click()}
        disabled={isScanning}
        title="Digitalizar Texto (OCR)"
      >
        {isScanning ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Scan className="h-4 w-4" />
        )}
      </Button>
    </>
  );
}
