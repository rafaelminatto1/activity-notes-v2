import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { MoreHorizontal, FileText, Edit2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProjectStore } from "@/stores/project-store";
import type { Project } from "@/types/project";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();
  const params = useParams();
  const { currentProject, setCurrentProject, deleteProject, updateProject } = useProjectStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = currentProject?.id === project.id;
  const docCount = project.documentCount ?? 0;

  const handleSelect = () => {
    setCurrentProject(project);
  };

  const handleDelete = async () => {
    try {
      await deleteProject(project.id);
    } catch (error) {
      console.error("Erro ao excluir projeto:", error);
    }
    setMenuOpen(false);
  };

  const handleRename = () => {
    // TODO: Implementar modal de renomear
    console.log("Renomear projeto:", project.id);
    setMenuOpen(false);
  };

  const handleNavigate = () => {
    setCurrentProject(project);
    router.push(`/documents?project=${project.id}`);
  };

  return (
    <button
      onClick={handleSelect}
      className={cn(
        "w-full text-left hover:bg-accent rounded-md p-3 transition-colors",
        isActive && "bg-accent ring-1 ring-primary"
      )}
    >
      {/* Header do card */}
      <div className="flex items-start gap-3">
        {/* Ícone do projeto */}
        <div
          className="flex-shrink-0 h-10 w-10 items-center justify-center rounded-md text-lg"
          style={{ backgroundColor: project.color }}
        >
          <span>{project.icon}</span>
        </div>

        {/* Conteúdo do card */}
        <div className="flex-1 min-w-0">
          {/* Título e contagem */}
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-sm truncate">{project.name}</span>
            {docCount > 0 && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {docCount}
              </span>
            )}
          </div>

          {/* Menu de contexto */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className={cn(
                "p-1 rounded hover:bg-muted transition-colors",
                menuOpen && "bg-muted"
              )}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full z-10 bg-card border border-border rounded-md shadow-lg w-40 py-1">
                <button
                  onClick={handleRename}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                >
                  <Edit2 className="h-4 w-4 text-muted-foreground" />
                  <span>Renomear</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Excluir</span>
                </button>
                <button
                  onClick={handleNavigate}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>Ver documentos</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
