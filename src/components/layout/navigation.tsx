"use client";

import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import {
  ChevronRight,
  FileText,
  MoreHorizontal,
  Plus,
  Star,
  Trash2,
  Copy,
  Sparkles,
  FolderOpen,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useDocuments } from "@/hooks/use-documents";
import {
  createDocument,
  archiveDocument,
  updateDocument,
  toggleFavorite,
} from "@/lib/firebase/firestore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useProjectStore } from "@/stores/project-store";

interface DocumentItemProps {
  id: string;
  title: string;
  icon: string;
  type: "document" | "canvas";
  childCount: number;
  level: number;
}

function DocumentItem({ id, title, icon, type, childCount, level }: DocumentItemProps) {
  const router = useRouter();
  const params = useParams();
  const { user, userProfile } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const closeMobile = useSidebarStore((s) => s.closeMobile);
  const { projects, moveDocumentToProject } = useProjectStore();

  const isActive = params.documentId === id;
  const hasChildren = childCount > 0;
  const isFavorite = userProfile?.favoriteIds?.includes(id) ?? false;

  async function handleCreate(e: React.MouseEvent) {
    e.stopPropagation();
    if (!user) return;
    try {
      const docId = await createDocument(user.uid, {
        parentDocumentId: id,
      });
      if (!expanded) setExpanded(true);
      router.push(`/documents/${docId}`);
    } catch {
      toast.error("Falha ao criar sub-página.");
    }
  }

  async function handleArchive() {
    try {
      await archiveDocument(id);
      toast.success("Documento movido para a lixeira.");
      if (isActive) router.push("/documents");
    } catch {
      toast.error("Falha ao arquivar documento.");
    }
  }

  async function handleToggleFavorite() {
    if (!user) return;
    try {
      const nowFavorite = await toggleFavorite(user.uid, id);
      toast.success(nowFavorite ? "Adicionado aos favoritos." : "Removido dos favoritos.");
    } catch {
      toast.error("Falha ao atualizar favoritos.");
    }
  }

  async function handleDuplicate() {
    if (!user) return;
    try {
      const docId = await createDocument(user.uid, {
        title: `${title || "Sem título"} (cópia)`,
      });
      router.push(`/documents/${docId}`);
      toast.success("Documento duplicado.");
    } catch {
      toast.error("Falha ao duplicar documento.");
    }
  }

  async function handleMoveToProject(projectId: string) {
    try {
      await moveDocumentToProject(id, projectId);
      toast.success("Documento movido para o projeto.");
      // Atualização otimista ou recarregamento pode ser necessário
    } catch {
      toast.error("Falha ao mover documento.");
    }
  }

  function handleNavigate() {
    router.push(`/documents/${id}`);
    closeMobile();
  }

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("documentId", id);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <>
      <div
        role="button"
        draggable
        onDragStart={handleDragStart}
        onClick={handleNavigate}
        className={cn(
          "group flex items-center gap-1 rounded-sm py-1 pr-1 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-grab active:cursor-grabbing",
          isActive && "bg-accent text-accent-foreground"
        )}
        style={{ paddingLeft: `${12 + level * 12}px` }}
      >
        {/* Expand/Collapse */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-sm hover:bg-muted-foreground/10",
            !hasChildren && "invisible"
          )}
        >
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-200",
              expanded && "rotate-90"
            )}
          />
        </button>

        {/* Icon */}
        {icon ? (
          <span className="shrink-0 text-sm">{icon}</span>
        ) : type === "canvas" ? (
          <LayoutDashboard className="h-4 w-4 shrink-0 text-primary/70" />
        ) : (
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}

        {/* Title */}
        <span className="truncate flex-1 ml-1">
          {title || "Sem título"}
        </span>

        {/* Hover actions */}
        <div className="ml-auto flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="flex h-5 w-5 items-center justify-center rounded-sm hover:bg-muted-foreground/10"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" className="w-48">
              <DropdownMenuItem onClick={handleToggleFavorite}>
                <Star className={cn("mr-2 h-4 w-4", isFavorite && "fill-current text-yellow-500")} />
                {isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicar
              </DropdownMenuItem>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Mover para...
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {projects.length > 0 ? (
                    projects.map(project => (
                      <DropdownMenuItem key={project.id} onClick={() => handleMoveToProject(project.id)}>
                        <span className="mr-2">{project.icon}</span>
                        {project.name}
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <DropdownMenuItem disabled>Sem projetos</DropdownMenuItem>
                  )}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuItem disabled>
                <Sparkles className="mr-2 h-4 w-4" />
                Pedir à IA para resumir
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

          <button
            onClick={handleCreate}
            className="flex h-5 w-5 items-center justify-center rounded-sm hover:bg-muted-foreground/10"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <DocumentList parentDocumentId={id} level={level + 1} />
      )}
    </>
  );
}

interface DocumentListProps {
  parentDocumentId: string | null;
  level: number;
}

function DocumentList({ parentDocumentId, level }: DocumentListProps) {
  const { documents, loading } = useDocuments(parentDocumentId);

  if (loading) {
    return (
      <div className="space-y-1 py-1" style={{ paddingLeft: `${12 + level * 12}px` }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-full" />
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <p
        className="py-1 text-xs text-muted-foreground"
        style={{ paddingLeft: `${24 + level * 12}px` }}
      >
        Nenhuma página aqui
      </p>
    );
  }

  return (
    <div className="space-y-0.5">
      {documents.map((doc) => (
        <DocumentItem
          key={doc.id}
          id={doc.id}
          title={doc.title}
          icon={doc.icon}
          type={doc.type}
          childCount={doc.childCount}
          level={level}
        />
      ))}
    </div>
  );
}

export function Navigation() {
  return <DocumentList parentDocumentId={null} level={0} />;
}
