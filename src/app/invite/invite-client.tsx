"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  acceptWorkspaceInvitation,
  getWorkspaceInvitationById,
} from "@/lib/firebase/workspaces";
import type { WorkspaceInvitation } from "@/types/workspace";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type InviteViewState =
  | "loading"
  | "needs_auth"
  | "processing"
  | "success"
  | "error";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export default function InviteClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  const invitationId = (searchParams.get("invitationId") || "").trim();
  const workspaceId = (searchParams.get("workspaceId") || "").trim();
  const inviteEmail = (searchParams.get("email") || "").trim();

  const [invitation, setInvitation] = useState<WorkspaceInvitation | null>(null);
  const [viewState, setViewState] = useState<InviteViewState>("loading");
  const [message, setMessage] = useState("Carregando convite...");
  const [isLoadingInvitation, setIsLoadingInvitation] = useState(true);
  const hasAttemptedAcceptRef = useRef(false);

  const inviteReturnPath = useMemo(() => {
    const params = new URLSearchParams();
    if (invitationId) params.set("invitationId", invitationId);
    if (workspaceId) params.set("workspaceId", workspaceId);
    if (inviteEmail) params.set("email", inviteEmail);
    const query = params.toString();
    return query ? `/invite?${query}` : "/invite";
  }, [invitationId, workspaceId, inviteEmail]);

  const loginHref = useMemo(
    () => `/login?next=${encodeURIComponent(inviteReturnPath)}`,
    [inviteReturnPath]
  );
  const registerHref = useMemo(
    () => `/register?next=${encodeURIComponent(inviteReturnPath)}`,
    [inviteReturnPath]
  );
  const appDeepLink = useMemo(() => {
    if (!invitationId) return "noteflow://invite";
    return `noteflow://invite?invitationId=${encodeURIComponent(invitationId)}`;
  }, [invitationId]);

  const loadInvitation = useCallback(async () => {
    hasAttemptedAcceptRef.current = false;
    setInvitation(null);

    if (!invitationId) {
      setViewState("error");
      setMessage("Link de convite inválido. Falta o parâmetro invitationId.");
      setIsLoadingInvitation(false);
      return;
    }

    setViewState("loading");
    setMessage("Carregando convite...");
    setIsLoadingInvitation(true);

    try {
      const data = await getWorkspaceInvitationById(invitationId);
      if (!data) {
        setViewState("error");
        setMessage("Convite não encontrado ou expirado.");
        return;
      }

      setInvitation(data);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Falha ao carregar convite.";
      setViewState("error");
      setMessage(errorMessage);
      return;
    } finally {
      setIsLoadingInvitation(false);
    }
  }, [invitationId]);

  useEffect(() => {
    void loadInvitation();
  }, [loadInvitation]);

  useEffect(() => {
    if (isLoadingInvitation || !invitation) return;

    if (authLoading) {
      setViewState("loading");
      setMessage("Verificando autenticação...");
      return;
    }

    if (!isAuthenticated || !user) {
      setViewState("needs_auth");
      setMessage("Faça login para aceitar este convite.");
      return;
    }

    const userEmail = normalizeEmail(user.email || "");
    const invitedEmail = normalizeEmail(invitation.invitedEmail || "");

    if (!userEmail) {
      setViewState("error");
      setMessage("Sua conta não possui e-mail válido para aceitar convites.");
      return;
    }

    if (invitedEmail && invitedEmail !== userEmail) {
      setViewState("error");
      setMessage(
        `Este convite foi enviado para ${invitation.invitedEmail}. Você está logado como ${user.email || "outro usuário"}.`
      );
      return;
    }

    if (invitation.status === "accepted") {
      setViewState("success");
      if (invitation.acceptedBy && invitation.acceptedBy !== user.uid) {
        setMessage("Este convite já foi aceito por outro usuário.");
        return;
      }
      setMessage("Convite já aceito para esta conta.");
      return;
    }

    if (invitation.status !== "pending") {
      setViewState("error");
      setMessage(
        `Este convite está com status "${invitation.status}" e não pode ser aceito.`
      );
      return;
    }

    if (hasAttemptedAcceptRef.current) return;
    hasAttemptedAcceptRef.current = true;

    setViewState("processing");
    setMessage("Aceitando convite...");

    void (async () => {
      try {
        await acceptWorkspaceInvitation({
          invitation,
          userId: user.uid,
          email: user.email || "",
          displayName: user.displayName || "",
        });
        setViewState("success");
        setMessage("Convite aceito com sucesso.");
      } catch (error) {
        hasAttemptedAcceptRef.current = false;
        const errorMessage =
          error instanceof Error ? error.message : "Falha ao aceitar convite.";
        setViewState("error");
        setMessage(errorMessage);
      }
    })();
  }, [authLoading, invitation, isAuthenticated, isLoadingInvitation, user]);

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto flex w-full max-w-[560px] flex-col gap-5 rounded-xl border bg-card p-6 shadow-sm">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Convite de espaço</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {invitation
              ? `${invitation.workspaceIcon} ${invitation.workspaceName}`
              : "Activity Notes"}
          </h1>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>

        {(viewState === "loading" || viewState === "processing" || authLoading) ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner className="h-4 w-4" />
            <span>
              {viewState === "processing"
                ? "Finalizando aceite..."
                : "Preparando convite..."}
            </span>
          </div>
        ) : null}

        {viewState === "needs_auth" ? (
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href={loginHref}>Entrar para aceitar</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={registerHref}>Criar conta</Link>
            </Button>
          </div>
        ) : null}

        {viewState === "success" ? (
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => router.push("/documents")}>
              Abrir documentos
            </Button>
            <Button variant="outline" asChild>
              <a href={appDeepLink}>
                Abrir no app
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        ) : null}

        {viewState === "error" ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void loadInvitation()}>
              Tentar novamente
            </Button>
            <Button onClick={() => router.push("/documents")}>
              Ir para documentos
            </Button>
          </div>
        ) : null}
      </div>
    </main>
  );
}
