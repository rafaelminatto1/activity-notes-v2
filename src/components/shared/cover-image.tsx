"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { ImagePlus, X, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { uploadCoverImage, deleteImage } from "@/lib/firebase/storage";
import { updateDocument } from "@/lib/firebase/firestore";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface CoverImageProps {
  documentId: string;
  coverImage?: string;
}

export function CoverImage({ documentId, coverImage }: CoverImageProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file || !user) return;

      setUploading(true);
      setProgress(0);

      try {
        const url = await uploadCoverImage(file, user.uid, documentId, (p) =>
          setProgress(p)
        );
        await updateDocument(documentId, { coverImage: url });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Falha no upload da capa."
        );
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [user, documentId]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp", ".gif"] },
    maxSize: 5 * 1024 * 1024,
    maxFiles: 1,
    disabled: uploading,
  });

  async function handleRemove() {
    if (!coverImage) return;
    try {
      await deleteImage(coverImage);
      await updateDocument(documentId, { coverImage: "" });
    } catch {
      toast.error("Falha ao remover capa.");
    }
  }

  // Upload state
  if (uploading) {
    return (
      <div className="group relative h-[30vh] w-full">
        <Skeleton className="h-full w-full" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <Upload className="h-8 w-8 animate-pulse text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Enviando... {progress}%
          </p>
          <div className="h-1 w-32 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Has cover image
  if (coverImage) {
    return (
      <div className="group relative h-[30vh] w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverImage}
          alt="Capa"
          className="h-full w-full object-cover"
        />
        <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div {...getRootProps()}>
            <input {...getInputProps()} aria-label="Alterar imagem de capa" />
            <Button variant="secondary" size="sm" className="shadow-sm">
              <ImagePlus className="mr-2 h-3.5 w-3.5" />
              Trocar capa
            </Button>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="shadow-sm"
            onClick={handleRemove}
          >
            <X className="mr-2 h-3.5 w-3.5" />
            Remover
          </Button>
        </div>
      </div>
    );
  }

  // No cover — drop zone (hidden by default, shown via parent button)
  return null;
}

// Separate button to add cover (used in document page)
export function AddCoverButton({ documentId }: { documentId: string }) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file || !user) return;

      setUploading(true);
      try {
        const url = await uploadCoverImage(file, user.uid, documentId);
        await updateDocument(documentId, { coverImage: url });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Falha no upload da capa."
        );
      } finally {
        setUploading(false);
      }
    },
    [user, documentId]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp", ".gif"] },
    maxSize: 5 * 1024 * 1024,
    maxFiles: 1,
    disabled: uploading,
    noClick: false,
    noDrag: true,
  });

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} aria-label="Adicionar capa" />
      <button
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        disabled={uploading}
      >
        <ImagePlus className="mr-1 inline h-3.5 w-3.5" />
        {uploading ? "Enviando..." : "Adicionar capa"}
      </button>
    </div>
  );
}
