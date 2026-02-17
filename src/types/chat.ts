import { Timestamp } from 'firebase/firestore';

export interface ChatChannel {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  type: 'public' | 'private';
  createdAt: Timestamp;
  createdBy: string;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  attachments?: ChatAttachment[];
  mentions?: string[];
  reactions: Record<string, string[]>;
  threadId?: string | null;
  replyCount?: number;
  isEdited: boolean;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface ChatAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface ChatInboxItem {
  id: string;
  userId: string;
  channelId: string;
  messageId: string;
  type: 'mention' | 'reply' | 'reaction';
  isRead: boolean;
  createdAt: Timestamp;
}
