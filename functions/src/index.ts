import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { setGlobalOptions } from "firebase-functions/v2";
import {
  onDocumentDeleted,
  onDocumentCreated,
} from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as functionsV1 from "firebase-functions/v1";

initializeApp();
setGlobalOptions({ region: "southamerica-east1" });

const db = getFirestore();
const storage = getStorage();

// ============================================================
// 1. onUserCreated — Create profile + welcome document
// ============================================================

export const onUserCreated = functionsV1
  .region("southamerica-east1")
  .auth.user()
  .onCreate(async (user) => {
    if (!user.uid) return;

    const uid = user.uid;
    const userRef = db.collection("users").doc(uid);
    const existing = await userRef.get();
    if (existing.exists) return;

    const now = FieldValue.serverTimestamp();

    // Create user profile with defaults
    await userRef.set({
      displayName: user.displayName ?? "",
      email: user.email ?? "",
      avatarUrl: user.photoURL ?? "",
      plan: "free",
      settings: {
        theme: "system",
        defaultView: "list",
        fontSize: "medium",
        contentWidth: "medium",
        aiEnabled: true,
        aiPreferredModel: "flash",
        aiResponseLanguage: "pt-BR",
      },
      favoriteIds: [],
      recentDocIds: [],
      createdAt: now,
      updatedAt: now,
    });

    // Create welcome document with tutorial content
    const welcomeContent = {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Bem-vindo ao Activity Notes!" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Este é seu primeiro documento. Aqui estão algumas dicas para começar:",
            },
          ],
        },
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      marks: [{ type: "bold" }],
                      text: "Comandos de barra:",
                    },
                    {
                      type: "text",
                      text: ' Digite "/" para acessar blocos como títulos, listas, tabelas e mais.',
                    },
                  ],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      marks: [{ type: "bold" }],
                      text: "IA integrada:",
                    },
                    {
                      type: "text",
                      text: " Selecione um texto e use a IA para melhorar, resumir, expandir ou traduzir.",
                    },
                  ],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      marks: [{ type: "bold" }],
                      text: "Organização:",
                    },
                    {
                      type: "text",
                      text: " Crie documentos aninhados, adicione ícones e capas para organizar suas notas.",
                    },
                  ],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      marks: [{ type: "bold" }],
                      text: "Atalhos:",
                    },
                    {
                      type: "text",
                      text: " Ctrl+K para buscar, Ctrl+N para novo documento, Ctrl+Shift+A para a IA.",
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Boas notas! ✨",
            },
          ],
        },
      ],
    };

    await db.collection("documents").add({
      title: "Bem-vindo ao Activity Notes",
      content: welcomeContent,
      plainText:
        "Bem-vindo ao Activity Notes! Este é seu primeiro documento. Comandos de barra, IA integrada, Organização, Atalhos.",
      icon: "👋",
      coverImage: "",
      workspaceId: "",
      parentDocumentId: null,
      userId: uid,
      isArchived: false,
      isPublished: false,
      position: 0,
      childCount: 0,
      createdAt: now,
      updatedAt: now,
    });
  });

// ============================================================
// 2. onDocumentDeleted — Clean up children + Storage images
// ============================================================

export const onDocDeleted = onDocumentDeleted(
  "documents/{documentId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const data = snap.data();
    const documentId = event.params.documentId;

    // Delete child documents recursively
    const children = await db
      .collection("documents")
      .where("parentDocumentId", "==", documentId)
      .get();

    const batch = db.batch();
    for (const child of children.docs) {
      batch.delete(child.ref);
    }
    if (!children.empty) {
      await batch.commit();
    }

    // Delete cover image from Storage if exists
    if (data.coverImage && typeof data.coverImage === "string") {
      await deleteStorageUrl(data.coverImage);
    }
  }
);

// ============================================================
// 3. scheduledCleanup — Daily: delete old trash + orphan images
// ============================================================

export const scheduledCleanup = onSchedule(
  { schedule: "every day 03:00", timeZone: "America/Sao_Paulo" },
  async () => {
    const thirtyDaysAgo = Timestamp.fromDate(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );

    // Find docs archived more than 30 days ago
    const archivedDocs = await db
      .collection("documents")
      .where("isArchived", "==", true)
      .where("updatedAt", "<", thirtyDaysAgo)
      .limit(500)
      .get();

    let deletedCount = 0;

    for (const doc of archivedDocs.docs) {
      const data = doc.data();

      // Delete cover image
      if (data.coverImage) {
        await deleteStorageUrl(data.coverImage);
      }

      // Delete the document
      await doc.ref.delete();
      deletedCount++;
    }

    console.log(
      `[scheduledCleanup] Deleted ${deletedCount} archived documents older than 30 days.`
    );
  }
);

// ============================================================
// 4. trackAIUsage — Callable: log AI usage + verify limits
// ============================================================

const AI_DAILY_LIMIT_FREE = 50;
const AI_DAILY_LIMIT_PRO = 500;

export const trackAIUsage = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Autenticação necessária.");
  }

  const uid = request.auth.uid;
  const { action } = request.data as { action?: string };

  if (!action) {
    throw new HttpsError("invalid-argument", "Ação é obrigatória.");
  }

  // Get user plan
  const userSnap = await db.collection("users").doc(uid).get();
  const plan = userSnap.exists ? userSnap.data()?.plan || "free" : "free";
  const dailyLimit =
    plan === "pro" ? AI_DAILY_LIMIT_PRO : AI_DAILY_LIMIT_FREE;

  // Check today's usage
  const today = new Date().toISOString().slice(0, 10);
  const usageRef = db
    .collection("users")
    .doc(uid)
    .collection("aiUsage")
    .doc(today);

  const usageSnap = await usageRef.get();
  const currentCount = usageSnap.exists ? usageSnap.data()?.count || 0 : 0;

  if (currentCount >= dailyLimit) {
    throw new HttpsError(
      "resource-exhausted",
      `Limite diário de ${dailyLimit} usos atingido.`
    );
  }

  // Increment usage
  await usageRef.set(
    {
      count: FieldValue.increment(1),
      lastAction: action,
      lastUsedAt: FieldValue.serverTimestamp(),
      date: today,
    },
    { merge: true }
  );

  return {
    count: currentCount + 1,
    limit: dailyLimit,
    remaining: dailyLimit - currentCount - 1,
  };
});

// ============================================================
// Bonus: onWelcomeDocCreated — track first document
// ============================================================

export const onDocCreated = onDocumentCreated(
  "documents/{documentId}",
  async (event) => {
    const data = event.data?.data();
    if (!data?.userId) return;

    // Update parent childCount if nested
    if (data.parentDocumentId) {
      const parentRef = db
        .collection("documents")
        .doc(data.parentDocumentId);
      await parentRef.update({
        childCount: FieldValue.increment(1),
      });
    }
  }
);

// ============================================================
// Helper: delete a Storage file by its download URL
// ============================================================

async function deleteStorageUrl(url: string): Promise<void> {
  try {
    // Extract path from Firebase Storage URL
    const bucket = storage.bucket();
    const match = url.match(/\/o\/(.+?)\?/);
    if (!match) return;
    const filePath = decodeURIComponent(match[1]);
    await bucket.file(filePath).delete();
  } catch (err: unknown) {
    const code = (err as { code?: number }).code;
    if (code === 404) return;
    console.warn("[deleteStorageUrl] Failed to delete:", url, err);
  }
}
