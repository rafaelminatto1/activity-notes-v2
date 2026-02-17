"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Star,
  Globe,
  MoreHorizontal,
  Copy,
  Trash2,
  Sparkles,
  Layout,
  Check,
  Loader2,
  AlertTriangle,
  Link2,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useAIStore } from "@/stores/ai-store";
import {
  publishDocument,
  toggleFavorite,
  createDocument,
  archiveDocument,
  createTemplate,
} from "@/lib/firebase/firestore";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { MenuItemWithIconColor } from "./menu-item-with-icon-color";
import { useEditorStore } from "@/stores/editor-store";
import { trackDocumentPublished } from "@/lib/firebase/analytics";
import { toast } from "sonner";
import { ShareDialog } from "@/components/collaboration/share-dialog";
import { TemplateEditor } from "@/components/smart/template-editor";
import type { Document } from "@/types/document";
import { AutoTagButton } from "@/components/ai/auto-tag-button";
import { LocationBadge } from "./location-badge";
import { Collaborators } from "@/components/collaboration/collaborators";
import { useCollaboration } from "@/hooks/use-collaboration";
import { SyncStatusIcon } from "@/components/layout/offline-indicator";

interface DocumentToolbarProps {
  document: Document;
}

export function DocumentToolbar({ document }: DocumentToolbarProps) {
  const router = useRouter();
  const { user, userProfile, refreshProfile } = useAuth();
  const { collaborators } = useCollaboration(document.id);
  const saveStatus = useEditorStore((s) => s.saveStatus);
  const toggleAIPanel = useAIStore((s) => s.togglePanel);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [templateEditorOpen, setTemplateEditorOpen] = useState(false);

  const isFavorite = userProfile?.favoriteIds?.includes(document.id) ?? false;
  const publicUrl = typeof window !== "undefined"
    ? `${window.location.origin}/preview/${document.id}`
    : `/preview/${document.id}`;

  async function handleSaveAsTemplate(data: any) {
    if (!user) return;
    try {
      await createTemplate(user.uid, {
        ...data,
        content: document.content,
      });
      toast.success("Template criado com sucesso!");
    } catch {
      toast.error("Falha ao criar template.");
    }
  }

  async function handlePublishToggle() {
    try {
      await publishDocument(document.id, !document.isPublished);
      trackDocumentPublished(!document.isPublished);
      if (!document.isPublished) {
        setShareOpen(true);
      }
      toast.success(
        document.isPublished
          ? "Documento despublicado."
          : "Documento publicado!"
      );
    } catch {
      toast.error("Falha ao alterar publicação.");
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Falha ao copiar link.");
    }
  }

  async function handleToggleFavorite() {
    if (!user) return;
    try {
      const nowFavorite = await toggleFavorite(user.uid, document.id);
      toast.success(
        nowFavorite ? "Adicionado aos favoritos." : "Removido dos favoritos."
      );
      // Atualizar perfil para sincronizar favoritos na sidebar
      await refreshProfile();
    } catch {
      toast.error("Falha ao atualizar favoritos.");
    }
  }

  async function handleDuplicate() {
    if (!user) return;
    try {
      const docId = await createDocument(user.uid, {
        title: `${document.title || "Sem título"} (cópia)`,
        content: document.content,
        plainText: document.plainText,
        icon: document.icon,
        parentDocumentId: document.parentDocumentId,
      });
      router.push(`/documents/${docId}`);
      toast.success("Documento duplicado.");
    } catch {
      toast.error("Falha ao duplicar documento.");
    }
  }

  async function handleArchive() {
    try {
      await archiveDocument(document.id);
      toast.success("Documento movido para a lixeira.");
      router.push("/documents");
    } catch {
      toast.error("Falha ao arquivar documento.");
    }
  }

  return (
    <>
      <div className="flex items-center gap-1 px-3 py-2 border-b">
        {/* Breadcrumb */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            {document.icon && <span className="text-sm">{document.icon}</span>}
            <span className="truncate">
              {document.title || "Sem título"}
            </span>
          </div>
        </div>

        {/* Save status */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground mr-2">
          {saveStatus === "saving" && (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Salvando...</span>
            </>
          )}
          {saveStatus === "saved" && (
            <>
              <Check className="h-3 w-3" />
              <span>Salvo</span>
            </>
          )}
          {saveStatus === "error" && (
            <>
              <AlertTriangle className="h-3 w-3 text-destructive" />
              <span className="text-destructive">Erro ao salvar</span>
            </>
          )}
        </div>

        {/* Share Button (Collaboration) */}
        <ShareDialog />

        <Separator orientation="vertical" className="mx-2 h-4" />

        <SyncStatusIcon />

        <Separator orientation="vertical" className="mx-2 h-4" />

        {/* Location */}
        <LocationBadge documentId={document.id} initialLocation={(document as any).location} />

        <Separator orientation="vertical" className="mx-2 h-4" />

        {/* Presence Indicators */}
        <Collaborators users={collaborators} />

        <Separator orientation="vertical" className="mx-2 h-4" />

        {/* Publish */}
        <Button
          variant="ghost"
          size="sm"
          onClick={document.isPublished ? () => setShareOpen(true) : handlePublishToggle}
          className={cn(
            "h-7 text-xs",
            document.isPublished && "text-blue-500"
          )}
        >
          <Globe className="mr-1 h-3.5 w-3.5" />
          {document.isPublished ? "Publicado" : "Publicar"}
        </Button>

        {/* Auto Tag */}
        <AutoTagButton documentId={document.id} content={document.plainText || ""} />

        {/* AI Panel toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs text-emerald-600 dark:text-emerald-400"
          onClick={toggleAIPanel}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">IA</span>
        </Button>

        {/* Icon/Color/Project menu */}
        <MenuItemWithIconColor documentId={document.id} currentIcon={document.icon} currentColor={document.color} />

        {/* More menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleDuplicate}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTemplateEditorOpen(true)}>
              <Layout className="mr-2 h-4 w-4" />
              Salvar como Template
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggleAIPanel}>
              <Sparkles className="mr-2 h-4 w-4" />
              Assistente IA
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleArchive}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Share / Publish Dialog */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-500" />
              {document.isPublished ? "Documento publicado" : "Publicar documento"}
            </DialogTitle>
            <DialogDescription>
              {document.isPublished
                ? "Qualquer pessoa com o link pode visualizar este documento."
                : "Ao publicar, o documento ficará acessível publicamente via link."}
            </DialogDescription>
          </DialogHeader>

          {document.isPublished ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  value={publicUrl}
                  readOnly
                  aria-label="Link público do documento"
                  className="flex-1 text-sm"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button size="sm" variant="outline" onClick={handleCopyLink}>
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Link2 className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  asChild
                >
                  <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-1 h-3.5 w-3.5" />
                    Abrir preview
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-destructive hover:text-destructive"
                  onClick={async () => {
                    await handlePublishToggle();
                    setShareOpen(false);
                  }}
                >
                  Despublicar
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShareOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handlePublishToggle}>
                <Globe className="mr-2 h-4 w-4" />
                Publicar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <TemplateEditor
        isOpen={templateEditorOpen}
        onClose={() => setTemplateEditorOpen(false)}
        onSave={handleSaveAsTemplate}
        template={{
          name: document.title,
          icon: document.icon || "📄",
        }}
      />
    </>
  );
}
