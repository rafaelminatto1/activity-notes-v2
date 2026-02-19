import { getFirestore, FieldValue } from "firebase-admin/firestore";
import {
  onDocumentCreated,
  onDocumentUpdated,
} from "firebase-functions/v2/firestore";
import * as functionsV1 from "firebase-functions/v1";
import nodemailer from "nodemailer";

type InvitationStatus = "pending" | "accepted" | "declined" | "canceled";

interface WorkspaceInvitationDoc {
  workspaceId?: string;
  workspaceName?: string;
  workspaceIcon?: string;
  invitedEmail?: string;
  invitedBy?: string;
  invitedByName?: string;
  status?: InvitationStatus;
}

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
  inviteBaseUrl: string;
}

const db = getFirestore();

function readLegacyConfig(path: string): string | undefined {
  const segments = path.split(".");
  let current: unknown = (functionsV1 as any).config();
  for (const segment of segments) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return typeof current === "string" ? current : undefined;
}

function readEnvOrLegacy(envKey: string, legacyPath: string): string | undefined {
  const envValue = process.env[envKey];
  if (envValue && envValue.trim().length > 0) return envValue.trim();
  const legacyValue = readLegacyConfig(legacyPath);
  return legacyValue?.trim() || undefined;
}

function parseBoolean(input: string | undefined, fallback = false): boolean {
  if (!input) return fallback;
  const normalized = input.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

function readEmailConfig(): EmailConfig | null {
  const host = readEnvOrLegacy("SMTP_HOST", "smtp.host");
  const user = readEnvOrLegacy("SMTP_USER", "smtp.user");
  const pass = readEnvOrLegacy("SMTP_PASS", "smtp.pass");
  const fromEmail = readEnvOrLegacy("SMTP_FROM_EMAIL", "smtp.from_email");

  if (!host || !user || !pass || !fromEmail) {
    return null;
  }

  const portRaw = readEnvOrLegacy("SMTP_PORT", "smtp.port");
  const secureRaw = readEnvOrLegacy("SMTP_SECURE", "smtp.secure");
  const fromName = readEnvOrLegacy("SMTP_FROM_NAME", "smtp.from_name") || "Activity Notes";
  const inviteBaseUrl =
    readEnvOrLegacy("WORKSPACE_INVITE_URL", "smtp.workspace_invite_url") ||
    "noteflow://invite";

  const parsedPort = Number(portRaw);
  const port = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 587;

  return {
    host,
    port,
    secure: parseBoolean(secureRaw, false),
    user,
    pass,
    fromEmail,
    fromName,
    inviteBaseUrl,
  };
}

function normalizeInvitation(raw: unknown): WorkspaceInvitationDoc | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  return {
    workspaceId: typeof data.workspaceId === "string" ? data.workspaceId : undefined,
    workspaceName: typeof data.workspaceName === "string" ? data.workspaceName : undefined,
    workspaceIcon: typeof data.workspaceIcon === "string" ? data.workspaceIcon : undefined,
    invitedEmail: typeof data.invitedEmail === "string" ? data.invitedEmail : undefined,
    invitedBy: typeof data.invitedBy === "string" ? data.invitedBy : undefined,
    invitedByName: typeof data.invitedByName === "string" ? data.invitedByName : undefined,
    status: typeof data.status === "string" ? (data.status as InvitationStatus) : undefined,
  };
}

function buildInvitationLink(config: EmailConfig, invitationId: string, invitation: WorkspaceInvitationDoc): string {
  const url = new URL(config.inviteBaseUrl);
  url.searchParams.set("invitationId", invitationId);
  if (invitation.workspaceId) url.searchParams.set("workspaceId", invitation.workspaceId);
  if (invitation.invitedEmail) url.searchParams.set("email", invitation.invitedEmail);
  return url.toString();
}

function buildEmailContent(link: string, invitation: WorkspaceInvitationDoc) {
  const workspaceName = invitation.workspaceName || "Espaco Activity Notes";
  const workspaceIcon = invitation.workspaceIcon || "🏢";
  const inviterName = invitation.invitedByName || "um membro da equipe";

  const subject = `${workspaceIcon} Convite para ${workspaceName} no Activity Notes`;
  const text = [
    `Voce recebeu um convite para entrar no workspace "${workspaceName}".`,
    "",
    `Convidado por: ${inviterName}`,
    "",
    "Clique no link para aceitar o convite:",
    link,
    "",
    "Se voce nao esperava este convite, pode ignorar este email.",
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;padding:20px;color:#111827;">
      <h2 style="margin:0 0 12px 0;">${workspaceIcon} Convite para o Activity Notes</h2>
      <p style="margin:0 0 8px 0;">Voce foi convidado para participar do workspace <strong>${workspaceName}</strong>.</p>
      <p style="margin:0 0 18px 0;">Convidado por: <strong>${inviterName}</strong></p>
      <a href="${link}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600;">
        Aceitar convite
      </a>
      <p style="margin:18px 0 0 0;font-size:13px;color:#6b7280;">Se o botao nao abrir, use este link:</p>
      <p style="margin:6px 0 0 0;font-size:13px;word-break:break-all;"><a href="${link}">${link}</a></p>
    </div>
  `;

  return { subject, text, html };
}

async function markDelivery(
  invitationId: string,
  payload: {
    status: "sent" | "failed" | "skipped_no_config";
    messageId?: string;
    error?: string;
    skipIncrement?: boolean;
  }
): Promise<void> {
  const invitationRef = db.collection("workspace_invitations").doc(invitationId);
  const updateData: Record<string, unknown> = {
    "emailDelivery.status": payload.status,
    "emailDelivery.provider": "smtp",
    "emailDelivery.lastAttemptAt": FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (!payload.skipIncrement) {
    updateData["emailDelivery.attempts"] = FieldValue.increment(1);
  }

  if (payload.messageId) {
    updateData["emailDelivery.messageId"] = payload.messageId;
    updateData["emailDelivery.lastError"] = FieldValue.delete();
    updateData["emailDelivery.lastSentAt"] = FieldValue.serverTimestamp();
  } else if (payload.error) {
    updateData["emailDelivery.lastError"] = payload.error.slice(0, 400);
  }

  await invitationRef.set(updateData, { merge: true });
}

async function sendWorkspaceInvitationEmail(
  invitationId: string,
  invitation: WorkspaceInvitationDoc
): Promise<void> {
  if (invitation.status !== "pending") return;
  if (!invitation.invitedEmail || !invitation.workspaceId) return;

  const config = readEmailConfig();
  if (!config) {
    console.warn(
      "[workspace-invitations] SMTP config missing. Set SMTP_HOST, SMTP_USER, SMTP_PASS and SMTP_FROM_EMAIL."
    );
    await markDelivery(invitationId, {
      status: "skipped_no_config",
      error: "SMTP configuration not set",
      skipIncrement: true,
    });
    return;
  }

  const link = buildInvitationLink(config, invitationId, invitation);
  const emailContent = buildEmailContent(link, invitation);

  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });

    const info = await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: invitation.invitedEmail,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    });

    await markDelivery(invitationId, {
      status: "sent",
      messageId: info.messageId,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown SMTP error";
    console.error("[workspace-invitations] send failure:", errorMessage);
    await markDelivery(invitationId, {
      status: "failed",
      error: errorMessage,
    });
  }
}

export const onWorkspaceInvitationCreated = onDocumentCreated(
  "workspace_invitations/{invitationId}",
  async (event) => {
    const invitationId = event.params.invitationId;
    if (!event.data || !invitationId) return;

    const invitation = normalizeInvitation(event.data.data());
    if (!invitation) return;

    await sendWorkspaceInvitationEmail(invitationId, invitation);
  }
);

export const onWorkspaceInvitationReopened = onDocumentUpdated(
  "workspace_invitations/{invitationId}",
  async (event) => {
    const invitationId = event.params.invitationId;
    if (!invitationId || !event.data) return;

    const before = normalizeInvitation(event.data.before.data());
    const after = normalizeInvitation(event.data.after.data());
    if (!after) return;

    if (before?.status === "pending" || after.status !== "pending") {
      return;
    }

    await sendWorkspaceInvitationEmail(invitationId, after);
  }
);
