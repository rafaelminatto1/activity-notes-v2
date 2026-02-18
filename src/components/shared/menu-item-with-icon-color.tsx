"use client";

import React from "react";
import { Star, Palette, MoreHorizontal, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIconStore, COLOR_PALETTE } from "@/stores/icon-store";
import { useProjectStore } from "@/stores/project-store";
import { updateDocument } from "@/lib/firebase/firestore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface MenuItemWithIconColorProps {
  documentId: string;
  currentIcon?: string;
  currentColor?: string;
}

export function MenuItemWithIconColor({
  documentId,
  currentIcon,
  currentColor,
}: MenuItemWithIconColorProps) {
  const { iconCategories, setSelectedIcon, setSelectedColor, addRecentIcon, addRecentColor } = useIconStore();
  const { projects, moveDocumentToProject } = useProjectStore();
  const [open, setOpen] = React.useState(false);

  const handleIconSelect = async (iconId: string, emoji: string) => {
    try {
      await updateDocument(documentId, { icon: emoji });
      setSelectedIcon(iconId);
      addRecentIcon(iconId);
      toast.success("Ícone atualizado");
    } catch (error) {
      toast.error("Erro ao atualizar ícone");
      console.error(error);
    }
  };

  const handleColorSelect = async (colorId: string, color: string) => {
    try {
      await updateDocument(documentId, { color });
      setSelectedColor(colorId);
      addRecentColor(colorId);
      toast.success("Cor atualizada");
    } catch (error) {
      toast.error("Erro ao atualizar cor");
      console.error(error);
    }
  };

  const handleMoveToProject = async (projectId: string) => {
    try {
      await moveDocumentToProject(documentId, projectId);
      toast.success("Documento movido para projeto");
      setOpen(false);
    } catch (error) {
      toast.error("Erro ao mover documento");
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <MoreHorizontal className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Personalizar documento</DialogTitle>
          <DialogDescription>
            Escolha um ícone, cor ou mova para um projeto
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Icon Categories */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Star size={16} className="text-muted-foreground" />
              <h3 className="text-sm font-semibold">Ícone</h3>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {iconCategories.map((category) => (
                <div key={category.id}>
                  <p className="text-xs text-muted-foreground mb-1">{category.name}</p>
                  <div className="grid grid-cols-8 gap-1">
                    {category.icons.map((icon) => (
                      <button
                        key={icon.id}
                        onClick={() => handleIconSelect(icon.id, icon.emoji)}
                        className={cn(
                          "w-8 h-8 flex items-center justify-center text-lg rounded hover:bg-accent transition-colors",
                          currentIcon === icon.emoji && "bg-accent ring-2 ring-primary"
                        )}
                        title={icon.id}
                      >
                        {icon.emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Color Palette */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Palette size={16} className="text-muted-foreground" />
              <h3 className="text-sm font-semibold">Cor</h3>
            </div>
            <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto">
              {COLOR_PALETTE.map((color) => (
                <button
                  key={color.id}
                  onClick={() => handleColorSelect(color.id, color.hex)}
                  className={cn(
                    "w-10 h-10 rounded-lg hover:scale-110 transition-transform",
                    currentColor === color.hex && "ring-2 ring-offset-2 ring-primary"
                  )}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Move to Project */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FolderOpen size={16} className="text-muted-foreground" />
              <h3 className="text-sm font-semibold">Mover para projeto</h3>
            </div>
            {projects.length > 0 ? (
              <div className="space-y-1">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleMoveToProject(project.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm rounded hover:bg-accent transition-colors"
                  >
                    <span className="text-lg">{project.icon}</span>
                    <span>{project.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum projeto criado ainda</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
