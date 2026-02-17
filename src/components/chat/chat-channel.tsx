"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChatMessage, ChatChannel as ChannelType, ChatAttachment } from "@/types/chat";
import { subscribeToMessages, sendMessage, addReaction, removeReaction } from "@/lib/firebase/chat";
import { MessageItem } from "./message-item";
import { MessageInput } from "./message-input";
import { useAuth } from "@/hooks/use-auth";
import { 
  Hash, 
  Info, 
  Users, 
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

interface ChatChannelProps {
  channel: ChannelType;
}

export function ChatChannel({ channel }: ChatChannelProps) {
  const { user, userProfile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeThread, setActiveThread] = useState<ChatMessage | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = subscribeToMessages(channel.id, (data) => {
      setMessages(data);
      // Auto scroll to bottom
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    });
    return () => unsub();
  }, [channel.id]);

  const handleSendMessage = async (text: string, attachments?: ChatAttachment[]) => {
    if (!user || !userProfile) return;

    // Basic mention detection
    const mentionRegex = /@(\w+)/g;
    const mentions = text.match(mentionRegex)?.map(m => m.substring(1)) || [];

    await sendMessage(channel.id, {
      userId: user.uid,
      userName: userProfile.displayName || user.email || "Usuário",
      userAvatar: userProfile.avatarUrl,
      text,
      attachments,
      mentions
    });
  };

  const handleSendReply = async (text: string, attachments?: ChatAttachment[]) => {
    if (!user || !userProfile || !activeThread) return;

    // Basic mention detection
    const mentionRegex = /@(\w+)/g;
    const mentions = text.match(mentionRegex)?.map(m => m.substring(1)) || [];

    await sendMessage(channel.id, {
      userId: user.uid,
      userName: userProfile.displayName || user.email || "Usuário",
      userAvatar: userProfile.avatarUrl,
      text,
      attachments,
      threadId: activeThread.id,
      mentions
    });
  };

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b shadow-sm">
        <div className="flex items-center gap-2">
          <Hash className="h-5 w-5 text-muted-foreground" />
          <div>
            <h2 className="font-bold text-base leading-tight">{channel.name}</h2>
            <p className="text-xs text-muted-foreground truncate max-w-[300px]">{channel.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Users className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Info className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Message Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto py-4 space-y-1 scroll-smooth"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
            <MessageSquare className="h-12 w-12 mb-2" />
            <p className="text-sm">Início da conversa em #{channel.name}</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageItem 
              key={msg.id} 
              message={msg}
              onAddReaction={(emoji) => addReaction(channel.id, msg.id, user?.uid || "", emoji)}
              onRemoveReaction={(emoji) => removeReaction(channel.id, msg.id, user?.uid || "", emoji)}
              onReply={() => setActiveThread(msg)}
            />
          ))
        )}
      </div>

      {/* Input */}
      <MessageInput onSendMessage={handleSendMessage} />

      {/* Thread View */}
      <ThreadView 
        parentMessage={activeThread} 
        onClose={() => setActiveThread(null)}
        onSendReply={handleSendReply}
        channelId={channel.id}
      />
    </div>
  );
}

function ThreadView({ 
  parentMessage, 
  onClose, 
  onSendReply,
  channelId 
}: { 
  parentMessage: ChatMessage | null; 
  onClose: () => void;
  onSendReply: (text: string, attachments?: ChatAttachment[]) => Promise<void>;
  channelId: string;
}) {
  const { user } = useAuth();
  const [replies, setReplies] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!parentMessage) return;
    const unsub = subscribeToMessages(channelId, setReplies, 100, parentMessage.id);
    return () => unsub();
  }, [parentMessage, channelId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [replies]);

  return (
    <Sheet open={!!parentMessage} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> Thread
          </SheetTitle>
          <SheetDescription>Conversa paralela</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto flex flex-col">
          {parentMessage && (
            <div className="border-b bg-muted/20">
              <MessageItem 
                message={parentMessage} 
                onAddReaction={() => {}} 
                onRemoveReaction={() => {}} 
                onReply={() => {}}
              />
              <div className="px-4 py-2 flex items-center gap-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  {replies.length} {replies.length === 1 ? "resposta" : "respostas"}
                </span>
                <Separator className="flex-1" />
              </div>
            </div>
          )}

          <div ref={scrollRef} className="flex-1 overflow-y-auto py-2">
            {replies.map((reply) => (
              <MessageItem 
                key={reply.id} 
                message={reply} 
                isReply
                onAddReaction={(emoji) => addReaction(channelId, reply.id, user?.uid || "", emoji)}
                onRemoveReaction={(emoji) => removeReaction(channelId, reply.id, user?.uid || "", emoji)}
                onReply={() => {}}
              />
            ))}
          </div>
        </div>

        <MessageInput onSendMessage={onSendReply} placeholder="Responder na thread..." />
      </SheetContent>
    </Sheet>
  );
}
