"use client";

import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useEffect, useState, useRef, useCallback } from "react";
import { Undo2, AlertTriangle } from "lucide-react";
import {
  subscribeToDocument,
  updateDocument,
  restoreDocument,
  addToRecentDocuments,
} from "@/lib/firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { useEditorStore } from "@/stores/editor-store";
import { CoverImage, AddCoverButton } from "@/components/shared/cover-image";
import { ExecutiveSummary } from "@/components/ai/executive-summary";
import { IconPicker } from "@/components/shared/icon-picker";
import { DocumentToolbar } from "@/components/shared/document-toolbar";
import { AIPanel } from "@/components/ai/ai-panel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { Document } from "@/types/document";
import type { JSONContent, Editor as TiptapEditor } from "@tiptap/core";
import type { useEditorAI } from "@/hooks/use-editor-ai";
import { useCollaborationStore } from "@/stores/collaboration-store";
import { ContextualSidebar } from "@/components/ai/contextual-sidebar";

const Editor = dynamic(
  () => import("@/components/editor/editor").then((mod) => mod.Editor),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-3 py-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    ),
  }
);

const CanvasEditor = dynamic(
  () => import("@/components/canvas/canvas-editor").then((mod) => mod.CanvasEditor),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[80vh] w-full rounded-xl" />,
  }
);

const AUTO_SAVE_DELAY = 1500;

export default function DocumentPage() {
  const params = useParams<{ documentId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { setSaving, setSaved, setError, setIdle } = useEditorStore();
  const initCollaboration = useCollaborationStore((s) => s.init);

  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentText, setCurrentText] = useState("");
  const [initialContent, setInitialContent] = useState<JSONContent | null>(null);
  const [editorInstance, setEditorInstance] = useState<TiptapEditor | null>(null);
  const [aiPanelReady, setAiPanelReady] = useState(false);
  const [aiPanelLoading, setAiPanelLoading] = useState(false);
  const [aiPanelUsage, setAiPanelUsage] = useState({ count: 0, remaining: 0, limit: 50 });
  const [documentContext, setDocumentContext] = useState("");

  // Track access
  useEffect(() => {
    if (user && params.documentId && !loading && document) {
      addToRecentDocuments(user.uid, params.documentId);
    }
  }, [user, params.documentId, loading, document]);

  // Local editable state
  const [title, setTitle] = useState("");
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedTitleRef = useRef("");
  const contentLoaded = useRef(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // AI integration
  const aiRef = useRef<ReturnType<typeof useEditorAI> | null>(null);
  const tiptapEditorRef = useRef<TiptapEditor | null>(null);

  const handleAIReady = useCallback((ai: ReturnType<typeof useEditorAI>) => {
    aiRef.current = ai;
    setAiPanelReady(true);
    setAiPanelLoading(ai.loading);
    setAiPanelUsage(ai.usage);
  }, []);

  const handleEditorReady = useCallback((editor: TiptapEditor) => {
    tiptapEditorRef.current = editor;
    setEditorInstance(editor);
    setDocumentContext(editor.getText().slice(0, 5000));
  }, []);

  const handleChatWithAI = useCallback(async (message: string, context: string) => {
    if (!aiRef.current) throw new Error("Editor não inicializado.");
    return aiRef.current.chatWithAI(message, context);
  }, []);

  const handleInsertToDocument = useCallback((text: string) => {
    if (!tiptapEditorRef.current) return;
    tiptapEditorRef.current.chain().focus().insertContent(text).run();
  }, []);

  // Initialize Collaboration
  useEffect(() => {
    if (!params.documentId || !user) return;
    const cleanup = initCollaboration(params.documentId, user);
    return cleanup;
  }, [params.documentId, user, initCollaboration]);

  // Subscribe to document
  useEffect(() => {
    if (!params.documentId) return;

    setIdle();
    contentLoaded.current = false;

    const unsubscribe = subscribeToDocument(params.documentId, (doc) => {
      setDocument(doc);
      if (doc) {
        // Only update title if it hasn't been locally edited
        if (lastSavedTitleRef.current === "" || doc.title === lastSavedTitleRef.current) {
          setTitle(doc.title);
          lastSavedTitleRef.current = doc.title;
        }
        // Pass initial content only once
        if (!contentLoaded.current) {
          setInitialContent(doc.content ?? null);
          contentLoaded.current = true;
        }
        setDocumentContext((doc.plainText || "").slice(0, 5000));
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (contentSaveTimerRef.current) clearTimeout(contentSaveTimerRef.current);
    };
  }, [params.documentId, setIdle]);

  // Auto-save title with debounce
  const saveTitle = useCallback(
    async (newTitle: string) => {
      if (!params.documentId) return;
      if (newTitle === lastSavedTitleRef.current) return;

      setSaving();
      try {
        await updateDocument(params.documentId, {
          title: newTitle,
        });
        lastSavedTitleRef.current = newTitle;
        setSaved();
      } catch {
        setError();
      }
    },
    [params.documentId, setSaving, setSaved, setError]
  );

  // Auto-save content with debounce
  const saveContent = useCallback(
    async (json: JSONContent, plainText: string) => {
      if (!params.documentId) return;

      setSaving();
      try {
        await updateDocument(params.documentId, {
          content: json,
          plainText: plainText.slice(0, 10000),
        });
        setSaved();
      } catch {
        setError();
      }
    },
    [params.documentId, setSaving, setSaved, setError]
  );

  function handleTitleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const newTitle = e.target.value;
    setTitle(newTitle);

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveTitle(newTitle), AUTO_SAVE_DELAY);
  }

  const handleEditorUpdate = useCallback(
    (json: JSONContent, plainText: string) => {
      if (contentSaveTimerRef.current) clearTimeout(contentSaveTimerRef.current);
      contentSaveTimerRef.current = setTimeout(() => saveContent(json, plainText), AUTO_SAVE_DELAY);
      setCurrentText(plainText);
      setDocumentContext(plainText.slice(0, 5000));
    },
    [saveContent]
  );

  // Auto-resize textarea
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = "auto";
      titleRef.current.style.height = titleRef.current.scrollHeight + "px";
    }
  }, [title]);

  async function handleIconChange(icon: string) {
    if (!params.documentId) return;
    try {
      await updateDocument(params.documentId, { icon });
    } catch {
      toast.error("Falha ao atualizar ícone.");
    }
  }

  async function handleRestore() {
    if (!params.documentId) return;
    try {
      await restoreDocument(params.documentId);
      toast.success("Documento restaurado.");
    } catch {
      toast.error("Falha ao restaurar documento.");
    }
  }

  function focusEditor() {
    const tiptap = editorRef.current?.querySelector(".tiptap") as HTMLElement | null;
    tiptap?.focus();
  }

  // Loading state
  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-8">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  // Not found or not authorized
  if (!document) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <AlertTriangle className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-medium">Documento não encontrado</h2>
        <p className="text-sm text-muted-foreground">
          Este documento não existe ou você não tem acesso.
        </p>
        <Button variant="outline" onClick={() => router.push("/documents")}>
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background/50">
      {/* Header Fixo / Toolbar Superior */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b">
        <DocumentToolbar document={document} />
      </header>

      {/* Área de Conteúdo Scrollable */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Banner de Arquivamento */}
        {document.isArchived && (
          <div className="flex items-center justify-center gap-2 bg-yellow-500/10 px-4 py-2 text-sm border-b border-yellow-500/20">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-yellow-700 dark:text-yellow-400 font-medium">
              Este documento está na lixeira.
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs bg-background hover:bg-yellow-500/10"
              onClick={handleRestore}
            >
              <Undo2 className="mr-1 h-3.5 w-3.5" />
              Restaurar
            </Button>
          </div>
        )}

        {/* Cover & Summary Layer */}
        <div className="relative group">
          <CoverImage
            documentId={document.id}
            coverImage={document.coverImage}
          />
          
          <div className="transition-all duration-500 transform translate-y-[-20px] opacity-0 group-hover:opacity-100 group-hover:translate-y-0">
             <ExecutiveSummary 
                documentId={document.id} 
                summary={document.summary} 
                content={currentText}
              />
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-6 sm:px-12 py-12 min-h-screen">
          {/* Header do Documento (Icon + Title) */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-4 group/icon">
              <IconPicker icon={document.icon} onChange={handleIconChange} />
              {!document.coverImage && (
                <div className="opacity-0 group-hover/icon:opacity-100 transition-opacity">
                  <AddCoverButton documentId={document.id} />
                </div>
              )}
            </div>

            <textarea
              ref={titleRef}
              value={title}
              onChange={handleTitleChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  focusEditor();
                }
              }}
              placeholder="Sem título"
              className="w-full resize-none overflow-hidden bg-transparent text-5xl font-black tracking-tight outline-none placeholder:text-muted-foreground/20 focus:placeholder:text-muted-foreground/10 transition-all"
              rows={1}
              disabled={document.isArchived}
            />
          </div>

          {/* Editor Central */}
          <div ref={editorRef} className="relative">
            {user && document.type === "canvas" ? (
              <CanvasEditor 
                documentId={document.id}
                initialNodes={document.canvasData?.nodes}
                initialEdges={document.canvasData?.edges}
                initialViewport={document.canvasData?.viewport}
                editable={!document.isArchived}
              />
            ) : user && (
              <Editor
                documentId={document.id}
                content={initialContent}
                onUpdate={handleEditorUpdate}
                editable={!document.isArchived}
                userId={user.uid}
                onAIReady={handleAIReady}
                onEditorReady={handleEditorReady}
              />
            )}
          </div>
        </div>
      </div>

      {/* Floating AI / Panels */}
      {aiPanelReady && (
        <AIPanel
          onChat={handleChatWithAI}
          onInsertToDocument={handleInsertToDocument}
          documentContext={documentContext}
          loading={aiPanelLoading}
          usage={aiPanelUsage}
        />
      )}

      <ContextualSidebar 
        documentId={params.documentId} 
        currentText={currentText}
        editor={editorInstance}
      />
    </div>
  );
}
