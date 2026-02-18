"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconPicker } from "@/components/icon/IconPicker";
import { ColorPicker } from "@/components/color/ColorPicker";
import { useProjectStore } from "@/stores/project-store";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface ProjectModalProps {
  open: boolean;
  onClose: () => void;
  projectId?: string; // If provided, edit mode
}

export function ProjectModal({ open, onClose, projectId }: ProjectModalProps) {
  const { user } = useAuth();
  const { createProject, updateProject, projects } = useProjectStore();

  const existingProject = projectId ? projects.find(p => p.id === projectId) : null;

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [color, setColor] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (existingProject) {
      setName(existingProject.name);
      setIcon(existingProject.icon);
      setColor(existingProject.color);
    } else {
      setName("");
      setIcon("📁");
      setColor("");
    }
  }, [existingProject, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!name.trim()) {
      toast.error("O nome do projeto é obrigatório");
      return;
    }

    setIsLoading(true);
    try {
      if (existingProject) {
        await updateProject(existingProject.id, { name, icon, color });
      } else {
        await createProject({
          name,
          icon,
          color,
          userId: user.uid
        });
      }
      onClose();
    } catch {
      toast.error("Erro ao salvar projeto");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{existingProject ? "Editar Projeto" : "Novo Projeto"}</DialogTitle>
        </DialogHeader>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-end gap-2 text-center">
                <div className="flex flex-col gap-1.5 items-center">
                  <Label>Ícone</Label>
                  <IconPicker icon={icon} onChange={setIcon} />
                </div>

                <div className="flex-1 flex flex-col gap-1.5">
                  <Label htmlFor="name" className="text-left">Nome</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Marketing, Pessoal..."
                    className="col-span-3"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Cor de identificação</Label>
                <div className="border rounded-md p-2">
                  <ColorPicker value={color} onChange={setColor} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : existingProject ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
