"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Edit2, Plus, Trash2, Users } from "lucide-react";
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
import { useAuth } from "@/hooks/use-auth";
import {
  acceptWorkspaceInvitation,
  createWorkspace,
  declineWorkspaceInvitation,
  deleteWorkspace,
  subscribeToInvitationsByEmail,
  subscribeToUserWorkspaces,
  updateWorkspace,
} from "@/lib/firebase/workspaces";
import type { Workspace, WorkspaceInvitation } from "@/types/workspace";
import { toast } from "sonner";

export default function EspacosPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [incomingInvitations, setIncomingInvitations] = useState<WorkspaceInvitation[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🏢");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = subscribeToUserWorkspaces(user.uid, (items) => {
      setWorkspaces(items);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.email) return;
    const unsubscribe = subscribeToInvitationsByEmail(user.email, (items) => {
      setIncomingInvitations(items);
    });
    return () => unsubscribe();
  }, [user?.email]);

  async function handleSaveWorkspace() {
    if (!user?.uid || !name.trim()) return;

    setSaving(true);
    try {
      if (editingWorkspace) {
        await updateWorkspace(editingWorkspace.id, user.uid, { name: name.trim(), icon });
        toast.success("Espaço atualizado.");
      } else {
        await createWorkspace(
          user.uid,
          { name: name.trim(), icon },
          { email: user.email || "", displayName: user.displayName || "Owner" }
        );
        toast.success("Espaço criado.");
      }
      setDialogOpen(false);
      setEditingWorkspace(null);
      setName("");
      setIcon("🏢");
    } catch {
      toast.error("Falha ao salvar espaço.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteWorkspace(item: Workspace) {
    if (!user?.uid) return;
    if (item.ownerId !== user.uid) {
      toast.error("Somente o owner pode excluir este espaço.");
      return;
    }
    if (!confirm(`Excluir espaço "${item.name}"?`)) return;

    try {
      await deleteWorkspace(item.id);
      toast.success("Espaço excluído.");
    } catch {
      toast.error("Falha ao excluir espaço.");
    }
  }

  async function handleAcceptInvitation(invitation: WorkspaceInvitation) {
    if (!user?.uid) return;
    try {
      await acceptWorkspaceInvitation({
        invitation,
        userId: user.uid,
        email: user.email || "",
        displayName: user.displayName || "Membro",
      });
      toast.success("Convite aceito.");
    } catch {
      toast.error("Falha ao aceitar convite.");
    }
  }

  async function handleDeclineInvitation(invitation: WorkspaceInvitation) {
    try {
      await declineWorkspaceInvitation(invitation.id);
      toast.success("Convite recusado.");
    } catch {
      toast.error("Falha ao recusar convite.");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Espaços</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie equipes, membros e projetos compartilhados.
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={() => {
            setEditingWorkspace(null);
            setName("");
            setIcon("🏢");
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Novo Espaço
        </Button>
      </div>

      {incomingInvitations.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Convites pendentes</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {incomingInvitations.map((invitation) => (
              <Card key={invitation.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    {invitation.workspaceIcon} {invitation.workspaceName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">
                    Convite enviado para {invitation.invitedEmail}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <Button size="sm" onClick={() => handleAcceptInvitation(invitation)}>
                      Aceitar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeclineInvitation(invitation)}
                    >
                      Recusar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {workspaces.length === 0 ? (
        <div className="rounded-xl border border-dashed px-6 py-16 text-center text-muted-foreground">
          Nenhum espaço criado ainda.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((workspace) => {
            const isOwner = workspace.ownerId === user?.uid;
            return (
              <Card key={workspace.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <span>{workspace.icon || "🏢"}</span>
                    <span className="truncate">{workspace.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span>{workspace.members?.length || 0} membros</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/espacos/${workspace.id}`)}
                    >
                      Abrir
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditingWorkspace(workspace);
                        setName(workspace.name);
                        setIcon(workspace.icon || "🏢");
                        setDialogOpen(true);
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => handleDeleteWorkspace(workspace)}
                      disabled={!isOwner}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingWorkspace ? "Editar Espaço" : "Novo Espaço"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome do espaço"
              />
            </div>
            <div className="space-y-2">
              <Label>Ícone</Label>
              <IconPicker icon={icon} onChange={setIcon} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button disabled={!name.trim() || saving} onClick={handleSaveWorkspace}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
