"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Edit2, MailPlus, Plus, Trash2, UserMinus, Users } from "lucide-react";
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
  subscribeWorkspaceProjects,
  updateProject,
} from "@/lib/firebase/projects";
import {
  cancelWorkspaceInvitation,
  inviteWorkspaceMemberByEmail,
  removeWorkspaceMember,
  subscribeWorkspaceById,
  subscribeToWorkspaceInvitations,
  subscribeToWorkspaceMembers,
} from "@/lib/firebase/workspaces";
import type { Project } from "@/types/project";
import type { Workspace, WorkspaceInvitation, WorkspaceMember } from "@/types/workspace";
import { toast } from "sonner";

type ProjectDraft = {
  id?: string;
  name: string;
  icon: string;
  color: string;
  kind: "folder" | "notebook";
};

const DEFAULT_DRAFT: ProjectDraft = {
  name: "",
  icon: "📁",
  color: "#10b981",
  kind: "folder",
};

export default function WorkspaceDetailPage() {
  const params = useParams<{ workspaceId: string }>();
  const workspaceId = params.workspaceId;
  const router = useRouter();
  const { user, ready } = useAuth();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<ProjectDraft>(DEFAULT_DRAFT);
  const [savingProject, setSavingProject] = useState(false);

  useEffect(() => {
    if (!workspaceId || !ready) return;
    const unsubWorkspace = subscribeWorkspaceById(workspaceId, setWorkspace);
    const unsubMembers = subscribeToWorkspaceMembers(workspaceId, setMembers);
    const unsubInvitations = subscribeToWorkspaceInvitations(workspaceId, setInvitations);
    const unsubProjects = subscribeWorkspaceProjects(workspaceId, setProjects);

    return () => {
      unsubWorkspace();
      unsubMembers();
      unsubInvitations();
      unsubProjects();
    };
  }, [workspaceId, ready]);

  const isOwner = useMemo(
    () => !!user?.uid && !!workspace && workspace.ownerId === user.uid,
    [user?.uid, workspace]
  );

  async function handleInvite() {
    if (!workspace || !user?.uid || !inviteEmail.trim()) return;
    try {
      await inviteWorkspaceMemberByEmail({
        workspace,
        invitedEmail: inviteEmail.trim(),
        invitedBy: user.uid,
        invitedByName: user.displayName || "Membro",
      });
      setInviteEmail("");
      toast.success("Convite enviado.");
    } catch {
      toast.error("Falha ao enviar convite.");
    }
  }

  async function handleCancelInvitation(invitationId: string) {
    try {
      await cancelWorkspaceInvitation(invitationId);
      toast.success("Convite cancelado.");
    } catch {
      toast.error("Falha ao cancelar convite.");
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!workspaceId) return;
    if (!confirm("Remover este membro do espaço?")) return;
    try {
      await removeWorkspaceMember(workspaceId, memberId);
      toast.success("Membro removido.");
    } catch {
      toast.error("Falha ao remover membro.");
    }
  }

  async function handleSaveProject() {
    if (!user?.uid || !workspaceId || !draft.name.trim()) return;

    setSavingProject(true);
    try {
      if (draft.id) {
        await updateProject(draft.id, {
          name: draft.name.trim(),
          icon: draft.icon,
          color: draft.color,
          kind: draft.kind,
        });
        toast.success("Projeto atualizado.");
      } else {
        await createProject({
          name: draft.name.trim(),
          icon: draft.icon,
          color: draft.color,
          kind: draft.kind,
          visibility: "shared",
          workspaceId,
          memberIds: members.map((member) => member.uid),
          userId: user.uid,
        });
        toast.success("Projeto criado.");
      }
      setDialogOpen(false);
      setDraft(DEFAULT_DRAFT);
    } catch {
      toast.error("Falha ao salvar projeto.");
    } finally {
      setSavingProject(false);
    }
  }

  async function handleDeleteProject(projectId: string) {
    if (!confirm("Excluir este projeto?")) return;
    try {
      await deleteProject(projectId);
      toast.success("Projeto excluído.");
    } catch {
      toast.error("Falha ao excluir projeto.");
    }
  }

  if (!workspace) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <p className="text-sm text-muted-foreground">Carregando espaço...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {workspace.icon || "🏢"} {workspace.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Owner: {workspace.ownerId}
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/espacos")}>
          Voltar
        </Button>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-4 w-4" />
              Membros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {members.map((member) => (
              <div
                key={member.uid}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium">{member.displayName}</p>
                  <p className="text-xs text-muted-foreground">{member.email || member.uid}</p>
                </div>
                {isOwner && member.uid !== workspace.ownerId && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => handleRemoveMember(member.uid)}
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MailPlus className="h-4 w-4" />
              Convites
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isOwner && (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="email@exemplo.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
                <Button onClick={handleInvite}>Convidar</Button>
              </div>
            )}

            {invitations.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem convites pendentes.</p>
            ) : (
              invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{invitation.invitedEmail}</p>
                    <p className="text-xs text-muted-foreground">Status: {invitation.status}</p>
                  </div>
                  {isOwner && invitation.status === "pending" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => handleCancelInvitation(invitation.id)}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Projetos do espaço</h2>
          <Button
            className="gap-2"
            onClick={() => {
              setDraft(DEFAULT_DRAFT);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Novo Projeto
          </Button>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-xl border border-dashed px-6 py-16 text-center text-muted-foreground">
            Nenhum projeto neste espaço.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card key={project.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <span>{project.icon || "📁"}</span>
                    <span className="truncate">{project.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-2 pt-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/documents?project=${project.id}`)}
                  >
                    Abrir
                  </Button>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setDraft({
                          id: project.id,
                          name: project.name,
                          icon: project.icon || "📁",
                          color: project.color || "#10b981",
                          kind:
                            project.kind === "notebook" || project.kind === "folder"
                              ? project.kind
                              : "folder",
                        });
                        setDialogOpen(true);
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => handleDeleteProject(project.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{draft.id ? "Editar Projeto" : "Novo Projeto"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={draft.name}
                onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Nome do projeto"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={draft.kind === "folder" ? "default" : "outline"}
                  onClick={() => setDraft((prev) => ({ ...prev, kind: "folder", icon: "📁" }))}
                >
                  Pasta
                </Button>
                <Button
                  type="button"
                  variant={draft.kind === "notebook" ? "default" : "outline"}
                  onClick={() => setDraft((prev) => ({ ...prev, kind: "notebook", icon: "📓" }))}
                >
                  Caderno
                </Button>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="space-y-2">
                <Label>Ícone</Label>
                <IconPicker
                  icon={draft.icon}
                  onChange={(value) => setDraft((prev) => ({ ...prev, icon: value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Cor</Label>
                <ColorPicker
                  value={draft.color}
                  onChange={(value) => setDraft((prev) => ({ ...prev, color: value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button disabled={!draft.name.trim() || savingProject} onClick={handleSaveProject}>
              {savingProject ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
