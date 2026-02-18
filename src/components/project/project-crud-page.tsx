"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconPicker } from "@/components/icon/IconPicker";
import { ColorPicker } from "@/components/color/ColorPicker";
import { useAuth } from "@/hooks/use-auth";
import {
  createProject,
  deleteProject,
  subscribeProjectsByKind,
  updateProject,
} from "@/lib/firebase/projects";
import { toast } from "sonner";
import type { Project, ProjectKind } from "@/types/project";

interface ProjectCrudPageProps {
  kind: "folder" | "notebook";
  title: string;
  emptyText: string;
}

export function ProjectCrudPage({ kind, title, emptyText }: ProjectCrudPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formName, setFormName] = useState("");
  const [formIcon, setFormIcon] = useState("");
  const [formColor, setFormColor] = useState("");

  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = subscribeProjectsByKind(user.uid, kind, (items) => {
      setProjects(items);
    });
    return () => unsubscribe();
  }, [user?.uid, kind]);

  const iconFallback = useMemo(() => (kind === "notebook" ? "📓" : "📁"), [kind]);
  const colorFallback = useMemo(() => (kind === "notebook" ? "#6366f1" : "#10b981"), [kind]);

  async function handleDelete(projectId: string) {
    if (!confirm("Excluir este item?")) return;
    try {
      await deleteProject(projectId);
      toast.success("Item excluído.");
    } catch {
      toast.error("Falha ao excluir.");
    }
  }

  async function handleSave(payload: { name: string; icon: string; color: string }) {
    if (!user?.uid) return;

    try {
      if (editingProject) {
        await updateProject(editingProject.id, payload);
        toast.success("Item atualizado.");
      } else {
        await createProject({
          name: payload.name,
          icon: payload.icon || iconFallback,
          color: payload.color || colorFallback,
          kind,
          visibility: "private",
          userId: user.uid,
        });
        toast.success(kind === "notebook" ? "Caderno criado!" : "Pasta criada!");
      }
      setDialogOpen(false);
      setEditingProject(null);
    } catch {
      toast.error("Falha ao salvar.");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">
            {kind === "notebook" ? "Gerencie seus cadernos" : "Gerencie suas pastas"}
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingProject(null);
            setFormName("");
            setFormIcon(iconFallback);
            setFormColor(colorFallback);
            setDialogOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          {kind === "notebook" ? "Novo Caderno" : "Nova Pasta"}
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed px-6 py-16 text-center text-muted-foreground">
          {emptyText}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="group">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <span>{project.icon || iconFallback}</span>
                  <span className="truncate">{project.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between pt-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/documents?project=${project.id}`)}
                >
                  Abrir
                </Button>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingProject(project);
                      setFormName(project.name);
                      setFormIcon(project.icon || iconFallback);
                      setFormColor(project.color || colorFallback);
                      setDialogOpen(true);
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(project.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ProjectUpsertDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingProject(null);
        }}
        initialProject={editingProject}
        kind={kind}
        name={formName}
        icon={formIcon}
        color={formColor}
        onNameChange={setFormName}
        onIconChange={setFormIcon}
        onColorChange={setFormColor}
        onSave={handleSave}
      />
    </div>
  );
}

function ProjectUpsertDialog({
  open,
  onOpenChange,
  initialProject,
  kind,
  name,
  icon,
  color,
  onNameChange,
  onIconChange,
  onColorChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialProject: Project | null;
  kind: ProjectKind;
  name: string;
  icon: string;
  color: string;
  onNameChange: (value: string) => void;
  onIconChange: (value: string) => void;
  onColorChange: (value: string) => void;
  onSave: (payload: { name: string; icon: string; color: string }) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialProject ? "Editar" : "Criar"} {kind === "notebook" ? "Caderno" : "Pasta"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => onNameChange(e.target.value)} placeholder="Digite o nome" />
            </div>
            <div className="flex items-start gap-4">
              <div className="space-y-2">
                <Label>Ícone</Label>
                <IconPicker icon={icon} onChange={onIconChange} />
              </div>
              <div className="space-y-2">
                <Label>Cor</Label>
                <ColorPicker value={color} onChange={onColorChange} />
              </div>
            </div>
          </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={!name.trim() || saving}
            onClick={async () => {
              setSaving(true);
              await onSave({ name: name.trim(), icon, color });
              setSaving(false);
            }}
          >
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
