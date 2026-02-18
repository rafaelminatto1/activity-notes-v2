import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy,
  deleteDoc, 
  serverTimestamp,
  Timestamp,
  addDoc
} from "firebase/firestore";
import { db } from "./config";

export type WebhookEvent = 
  | "task.created" | "task.updated" | "task.deleted" 
  | "document.created" | "document.updated" | "document.deleted";

export interface Webhook {
  id: string;
  url: string;
  events: WebhookEvent[];
  projectId?: string;
  userId: string;
  createdAt: Timestamp;
}

export interface WebhookLog {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  payload: Record<string, unknown>;
  status: number;
  response: string;
  createdAt: Timestamp;
  is_resend?: boolean;
}

const WEBHOOKS_COLLECTION = "webhooks";
const LOGS_COLLECTION = "webhook_logs";

function getDb() {
  if (!db) throw new Error("Firestore não inicializado.");
  return db;
}

export async function createWebhook(userId: string, data: Omit<Webhook, "id" | "userId" | "createdAt">): Promise<string> {
  const colRef = collection(getDb(), WEBHOOKS_COLLECTION);
  const newDoc = await addDoc(colRef, {
    ...data,
    userId,
    createdAt: serverTimestamp(),
  });
  return newDoc.id;
}

export async function getWebhooks(userId: string, projectId?: string): Promise<Webhook[]> {
  let q = query(collection(getDb(), WEBHOOKS_COLLECTION), where("userId", "==", userId));
  if (projectId) {
    q = query(q, where("projectId", "==", projectId));
  }
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Webhook));
}

export async function deleteWebhook(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), WEBHOOKS_COLLECTION, id));
}

export async function triggerWebhooks(userId: string, event: WebhookEvent, payload: Record<string, unknown>, projectId?: string) {
  const webhooks = await getWebhooks(userId, projectId);
  
  const relevant = webhooks.filter(w => w.events.includes(event));
  
  for (const webhook of relevant) {
    try {
      const res = await fetch(webhook.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, payload, timestamp: new Date().toISOString() }),
      });
      
      await addDoc(collection(getDb(), LOGS_COLLECTION), {
        webhookId: webhook.id,
        event,
        payload,
        status: res.status,
        response: await res.text(),
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      await addDoc(collection(getDb(), LOGS_COLLECTION), {
        webhookId: webhook.id,
        event,
        payload,
        status: 0,
        response: error instanceof Error ? error.message : "Network error",
        createdAt: serverTimestamp(),
      });
    }
  }
}

export async function getWebhookLogs(webhookId: string): Promise<WebhookLog[]> {
  const q = query(
    collection(getDb(), LOGS_COLLECTION), 
    where("webhookId", "==", webhookId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as WebhookLog));
}

export async function resendWebhook(log: WebhookLog): Promise<boolean> {
  const webhookDoc = await getDoc(doc(getDb(), WEBHOOKS_COLLECTION, log.webhookId));
  if (!webhookDoc.exists()) return false;
  
  const webhook = { id: webhookDoc.id, ...webhookDoc.data() } as Webhook;

  try {
    const res = await fetch(webhook.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        event: log.event, 
        payload: log.payload, 
        timestamp: new Date().toISOString(),
        is_resend: true
      }),
    });
    
    await addDoc(collection(getDb(), LOGS_COLLECTION), {
      webhookId: webhook.id,
      event: log.event,
      payload: log.payload,
      status: res.status,
      response: await res.text(),
      createdAt: serverTimestamp(),
      is_resend: true
    });
    
    return res.ok;
  } catch {
    return false;
  }
}
