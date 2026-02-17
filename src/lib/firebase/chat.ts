import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  limit,
  startAfter,
  Timestamp,
  increment,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "./config";
import type { ChatChannel, ChatMessage, ChatInboxItem } from "@/types/chat";

function getDb() {
  if (!db) throw new Error("Firestore não inicializado.");
  return db;
}

// ---- Channels ----

export interface CreateChannelParams {
  projectId: string;
  name: string;
  description?: string;
  isPrivate?: boolean;
  userId: string;
}

export async function createChannel({
  projectId,
  name,
  description,
  isPrivate,
  userId
}: CreateChannelParams): Promise<string> {
  const colRef = collection(getDb(), "channels");
  const data = {
    projectId,
    name: name.startsWith("#") ? name : `#${name}`,
    description: description || "",
    type: isPrivate ? "private" : "public",
    createdBy: userId,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(colRef, data);
  return docRef.id;
}

export async function getChannels(projectId: string): Promise<ChatChannel[]> {
  const q = query(
    collection(getDb(), "channels"),
    where("projectId", "==", projectId),
    orderBy("name", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatChannel));
}

export function subscribeToChannels(projectId: string, callback: (channels: ChatChannel[]) => void) {
  const q = query(
    collection(getDb(), "channels"),
    where("projectId", "==", projectId),
    orderBy("name", "asc")
  );
  return onSnapshot(q, (snap) => {
    const channels = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatChannel));
    callback(channels);
  });
}

// ---- Messages ----

export type SendMessageData = Omit<ChatMessage, "id" | "channelId" | "createdAt" | "isEdited" | "reactions" | "replyCount"> & {
  threadId?: string | null;
};

export async function sendMessage(
  channelId: string,
  messageData: SendMessageData
): Promise<string> {
  const colRef = collection(getDb(), "chats", channelId, "messages");
  
  const data = {
    ...messageData,
    channelId,
    threadId: messageData.threadId || null,
    isEdited: false,
    reactions: {},
    replyCount: 0,
    createdAt: serverTimestamp(),
  };
  
  const docRef = await addDoc(colRef, data);

  // If it's a reply, increment parent's replyCount
  if (messageData.threadId) {
    const parentRef = doc(getDb(), "chats", channelId, "messages", messageData.threadId);
    await updateDoc(parentRef, {
      replyCount: increment(1)
    });
  }

  // Handle mentions for Inbox
  if (messageData.mentions && messageData.mentions.length > 0) {
    for (const userId of messageData.mentions) {
      await createInboxItem({
        userId,
        channelId,
        messageId: docRef.id,
        type: "mention",
      });
    }
  }

  return docRef.id;
}

export function subscribeToMessages(
  channelId: string,
  callback: (messages: ChatMessage[]) => void,
  limitNum: number = 50,
  threadId?: string | null
) {
  const baseQuery = collection(getDb(), "chats", channelId, "messages");
  
  let q;
  if (threadId) {
    q = query(
      baseQuery,
      where("threadId", "==", threadId),
      orderBy("createdAt", "asc")
    );
  } else {
    q = query(
      baseQuery,
      where("threadId", "==", null),
      orderBy("createdAt", "desc"),
      limit(limitNum)
    );
  }

  return onSnapshot(q, (snap) => {
    let messages = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage));
    if (!threadId) {
      messages = messages.reverse();
    }
    callback(messages);
  });
}

export async function loadMoreMessages(
  channelId: string,
  lastMessageTimestamp: Timestamp,
  limitNum: number = 20
): Promise<ChatMessage[]> {
  const q = query(
    collection(getDb(), "chats", channelId, "messages"),
    where("threadId", "==", null),
    orderBy("createdAt", "desc"),
    startAfter(lastMessageTimestamp),
    limit(limitNum)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage)).reverse();
}

// ---- Reactions ----

export async function addReaction(channelId: string, messageId: string, userId: string, emoji: string) {
  const ref = doc(getDb(), "chats", channelId, "messages", messageId);
  await updateDoc(ref, {
    [`reactions.${emoji}`]: arrayUnion(userId),
  });
}

export async function removeReaction(channelId: string, messageId: string, userId: string, emoji: string) {
  const ref = doc(getDb(), "chats", channelId, "messages", messageId);
  await updateDoc(ref, {
    [`reactions.${emoji}`]: arrayRemove(userId),
  });
}

// ---- Inbox ----

async function createInboxItem(item: Omit<ChatInboxItem, "id" | "createdAt" | "isRead">) {
  const colRef = collection(getDb(), "inbox");
  await addDoc(colRef, {
    ...item,
    isRead: false,
    createdAt: serverTimestamp(),
  });
}

export function subscribeToInbox(userId: string, callback: (items: ChatInboxItem[]) => void) {
  const q = query(
    collection(getDb(), "inbox"),
    where("userId", "==", userId),
    where("isRead", "==", false),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatInboxItem));
    callback(items);
  });
}

export async function markAsRead(itemId: string) {
  const ref = doc(getDb(), "inbox", itemId);
  await updateDoc(ref, { isRead: true });
}
