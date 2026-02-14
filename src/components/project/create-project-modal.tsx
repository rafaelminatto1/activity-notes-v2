"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconPicker } from "@/components/icon/icon-picker";
import { ColorPicker } from "@/components/icon/color-picker";
import { useIconStore, COLOR_PALETTE } from "@/stores/icon-store";
import { useAuth } from "@/hooks/use-auth";
import { useProjectStore } from "@/stores/project-store";
import type { ProjectCreate } from "@/types/project";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateProjectModal({ open, onClose }: CreateProjectModalProps) {
  const { user } = useAuth();
  const { selectedIcon, selectedColor, setSelectedIcon, setSelectedColor } = useIconStore();
  const { createProject } = useProjectStore();
  const [name, setName] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!name.trim() || !user) {
        if (!name.trim()) {
          toast.error("Por favor, insira um nome para o projeto.");
        }
        if (!user) {
          toast.error("Você precisa estar logado para criar um projeto.");
        }
        return;
      }

      try {
        const projectId = await createProject({
          name: name.trim(),
          icon: selectedIcon || "",
          color: selectedColor || COLOR_PALETTE[4].hex, // Verde padrão
          userId: user.uid,
        });

        toast.success("Projeto criado com sucesso!");
        onClose();
      } catch (error) {
        toast.error("Falha ao criar projeto.");
      }

      // Limpar e fechar
      setName("");
      setSelectedIcon(null);
      setSelectedColor(null);
    },
    [name, selectedIcon, selectedColor, onClose, setSelectedIcon, setSelectedColor, createProject, user]
  );

  // Focar no input ao abrir
  useEffect(() => {
    if (open && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [open]);

  if (!open) return null;

  return (
    <>
      <IconPicker open={showIconPicker} onClose={() => setShowIconPicker(false)} onSelect={setSelectedIcon} />
      <ColorPicker open={showColorPicker} onClose={() => setShowColorPicker(false)} onSelect={setSelectedColor} currentColor={selectedColor || undefined} />

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-card text-card-foreground rounded-lg shadow-lg w-full max-w-md border border-border">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border p-4">
            <h2 className="text-lg font-semibold">Novo Projeto</h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Nome do projeto */}
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">
                Nome do projeto
              </label>
              <Input
                ref={nameInputRef}
                type="text"
                placeholder="Ex: Trabalho, Pessoal, Estudos..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full"
                maxLength={50}
              />
            </div>

            {/* Seleção de Ícone */}
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">
                Ícone
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowIconPicker(true)}
                  className="h-10 w-10 text-xl"
                >
                  {selectedIcon || "📄"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedIcon(null)}
                  className={cn(
                    "h-6 w-6 text-xs text-muted-foreground transition-colors",
                    !selectedIcon && "invisible"
                  )}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Seleção de Cor */}
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">
                Cor
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowColorPicker(true)}
                  className="h-10 w-10"
                  style={{ backgroundColor: selectedColor || COLOR_PALETTE[4].hex }}
                >
                  {selectedColor && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedColor(null)}
                  className={cn(
                    "h-6 w-6 text-xs text-muted-foreground transition-colors",
                    !selectedColor && "invisible"
                  )}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex items-center gap-2"
                disabled={!name.trim()}
              >
                <Plus className="h-4 w-4" />
                Criar Projeto
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
