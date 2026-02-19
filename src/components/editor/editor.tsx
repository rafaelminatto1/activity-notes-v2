"use client";

import { useCallback, useRef, useEffect, useMemo } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import type { JSONContent, Editor as TiptapEditor } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";
import { getEditorExtensions } from "./extensions";
import { createSlashCommandExtension, SlashCommandMenu } from "./slash-command";
import { Toolbar } from "./toolbar";
import { EditorBubbleMenu } from "./bubble-menu";
import { TableControls } from "./table-controls";
import { useEditorAI } from "@/hooks/use-editor-ai";
import { uploadImage, uploadFile } from "@/lib/firebase/storage";
import { toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAutoEmbedding } from "@/hooks/use-auto-embedding";
import { useCollaboration } from "@/hooks/use-collaboration";

interface EditorProps {
  documentId: string;
  content: JSONContent | null;
  onUpdate: (json: JSONContent, plainText: string) => void;
  editable?: boolean;
  userId: string;
  onAIReady?: (ai: ReturnType<typeof useEditorAI>) => void;
  onEditorReady?: (editor: TiptapEditor) => void;
}

export function Editor({
  documentId,
  content,
  onUpdate,
  editable = true,
  userId,
  onAIReady,
  onEditorReady,
}: EditorProps) {
  useAutoEmbedding(documentId);
  const { updateCursor } = useCollaboration(documentId);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const annotatableImageInputRef = useRef<HTMLInputElement>(null);
  const initialContentSet = useRef(false);

  const handleImageUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handlePdfUpload = useCallback(() => {
    pdfInputRef.current?.click();
  }, []);

  const handleAnnotatableImageUpload = useCallback(() => {
    annotatableImageInputRef.current?.click();
  }, []);

  const slashCommandExtension = useMemo(
    () => createSlashCommandExtension(),
    []
  );

  const extensions = useMemo(() => {
    return [...getEditorExtensions(), slashCommandExtension];
  }, [slashCommandExtension]);

  const editor = useEditor({
    extensions,
    editable,
    content: content || undefined,
    immediatelyRender: true,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        class: "tiptap prose prose-sm dark:prose-invert max-w-none min-h-[50vh] outline-none",
      },
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files;
        if (!files?.length) return false;

        const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
        if (!imageFiles.length) return false;

        event.preventDefault();
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });

        imageFiles.forEach((file) => {
          handleImageFile(file, view.state.doc.resolve(pos?.pos ?? view.state.selection.from).pos);
        });

        return true;
      },
      handlePaste: (_view, event) => {
        const files = event.clipboardData?.files;
        if (!files?.length) return false;

        const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
        if (!imageFiles.length) return false;

        event.preventDefault();
        imageFiles.forEach((file) => {
          handleImageFile(file);
        });

        return true;
      },
    },
    onUpdate: ({ editor: e }) => {
      const json = e.getJSON();
      const text = e.getText().slice(0, 10000);
      onUpdate(json, text);
    },
    onSelectionUpdate: ({ editor: e }) => {
      const { from, to } = e.state.selection;
      updateCursor(from, to - from);
    },
  });

  const ai = useEditorAI(editor);

  // Expose AI and editor to parent
  useEffect(() => {
    if (ai && onAIReady) onAIReady(ai);
  }, [ai, onAIReady]);

  useEffect(() => {
    if (editor && onEditorReady) onEditorReady(editor);
  }, [editor, onEditorReady]);

  // Set initial content only once
  useEffect(() => {
    if (editor && content && !initialContentSet.current) {
      initialContentSet.current = true;
      if (editor.isEmpty) {
        editor.commands.setContent(content);
      }
    }
  }, [editor, content]);

  // Listen for slash AI commands
  useEffect(() => {
    function handleSlashAI(e: Event) {
      const action = (e as CustomEvent).detail;
      switch (action) {
        case "continueWriting":
          ai.continueWriting();
          break;
        case "summarizeAbove":
          ai.summarizeAbove();
          break;
        case "generateIdeas":
          ai.generateIdeas();
          break;
        case "translate":
          ai.translateSelection("English");
          break;
        case "freePrompt": {
          const prompt = window.prompt("O que você gostaria que a IA escrevesse?");
          if (prompt) ai.freePrompt(prompt);
          break;
        }
        case "generateDiagram": {
          const desc = window.prompt("Descreva o diagrama que deseja criar:");
          if (desc) ai.generateDiagram(desc);
          break;
        }
        case "slash-pdf":
          handlePdfUpload();
          break;
        case "slash-image-annotate":
          handleAnnotatableImageUpload();
          break;
      }
    }

    window.addEventListener("slash-ai", handleSlashAI);
    window.addEventListener("slash-pdf", handleSlashAI);
    window.addEventListener("slash-image-annotate", handleSlashAI);
    return () => {
      window.removeEventListener("slash-ai", handleSlashAI);
      window.removeEventListener("slash-pdf", handleSlashAI);
      window.removeEventListener("slash-image-annotate", handleSlashAI);
    };
  }, [ai, handlePdfUpload, handleAnnotatableImageUpload]);

  useEffect(() => {
    const openImagePicker = () => {
      handleImageUpload();
    };

    window.addEventListener("editor-request-image-upload", openImagePicker);
    return () => {
      window.removeEventListener("editor-request-image-upload", openImagePicker);
    };
  }, [handleImageUpload]);

  // Listen for mention/backlink insertion and update Firestore
  useEffect(() => {
    if (!editor) return void 0;

    const handleTransaction = () => {
      // Find all mentions in the document
      const mentions: string[] = [];
      editor.state.doc.descendants((node: PMNode) => {
        if (node.type.name === "mention" && node.attrs.id) {
          mentions.push(node.attrs.id);
        }
      });

      // Update backlinks asynchronously
      if (mentions.length > 0) {
        fetch(`/api/documents/${documentId}/backlinks`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ addBacklink: mentions[0] }),
        }).catch(console.error);
      }
    };

    editor.on("transaction", handleTransaction);
    return () => {
      editor.off("transaction", handleTransaction);
    };
  }, [editor, documentId]);

  const handleImageFile = useCallback(
    async (file: File, pos?: number) => {
      if (!editor) return;

      const toastId = toast.loading("Enviando imagem...");
      try {
        const url = await uploadImage(file, userId, "editor-images", (progress) => {
          toast.loading(`Enviando imagem... ${progress}%`, { id: toastId });
        });

        if (pos !== undefined) {
          editor.chain().focus().insertContentAt(pos, {
            type: "image",
            attrs: { src: url },
          }).run();
        } else {
          editor.chain().focus().setImage({ src: url }).run();
        }

        toast.success("Imagem enviada!", { id: toastId });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Erro ao enviar imagem.",
          { id: toastId }
        );
      }
    },
    [editor, userId]
  );

  const handleAnnotatableFile = useCallback(
    async (file: File, type: "pdf" | "image") => {
      if (!editor) return;

      const toastId = toast.loading(`Enviando ${type === "pdf" ? "PDF" : "imagem"}...`);
      try {
        // Use uploadFile for PDF/Annotatable to preserve quality/format
        const url = await uploadFile(file, userId, "annotatable-files", (progress) => {
          toast.loading(`Enviando... ${progress}%`, { id: toastId });
        });

        editor.chain().focus().insertContent({
          type: "pdfAnnotator",
          attrs: {
            src: url,
            type: type,
            title: file.name,
            width: "100%",
          },
        }).run();

        toast.success("Arquivo pronto para anotação!", { id: toastId });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Erro ao enviar arquivo.",
          { id: toastId }
        );
      }
    },
    [editor, userId]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleImageFile(file);
      e.target.value = "";
    },
    [handleImageFile]
  );

  const handlePdfInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleAnnotatableFile(file, "pdf");
      e.target.value = "";
    },
    [handleAnnotatableFile]
  );

  const handleAnnotatableImageInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleAnnotatableFile(file, "image");
      e.target.value = "";
    },
    [handleAnnotatableFile]
  );

  if (!editor) return null;

  return (
    <TooltipProvider>
      <div className="editor-wrapper relative">
        <Toolbar
          editor={editor}
          documentId={documentId}
          onImageUpload={handleImageUpload}
          aiProps={{
            onSummarize: ai.summarizeSelection,
            onExpand: ai.expandSelection,
            onImprove: ai.improveSelection,
            onSimplify: ai.simplifySelection,
            onFixSpelling: ai.fixSpelling,
            onFormat: ai.formatNote,
            onCheckConsistency: ai.checkConsistency,
            onTranslate: ai.translateSelection,
            onChangeTone: ai.changeTone,
            onFreePrompt: ai.freePrompt,
            usage: ai.usage,
            loading: ai.loading,
          }}
        />
        <EditorBubbleMenu editor={editor} />
        <TableControls editor={editor} />
        <SlashCommandMenu editor={editor} onImageUpload={handleImageUpload} />
        <EditorContent editor={editor} className="mt-4" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileInputChange}
        />
        <input
          ref={pdfInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handlePdfInputChange}
        />
        <input
          ref={annotatableImageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAnnotatableImageInputChange}
        />
      </div>
    </TooltipProvider>
  );
}
