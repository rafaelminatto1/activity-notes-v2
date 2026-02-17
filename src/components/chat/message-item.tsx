"use client";

import React from "react";
import { ChatMessage } from "@/types/chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Smile, 
  MessageSquareReply, 
  MoreHorizontal,
  FileIcon,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

interface MessageItemProps {
  message: ChatMessage;
  onAddReaction: (emoji: string) => void;
  onRemoveReaction: (emoji: string) => void;
  onReply: () => void;
  isReply?: boolean;
}

export function MessageItem({ 
  message, 
  onAddReaction, 
  onRemoveReaction, 
  onReply,
  isReply 
}: MessageItemProps) {
  const { user } = useAuth();
  const isOwner = user?.uid === message.userId;

  const initials = message.userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleEmojiSelect = (emoji: { native: string }) => {
    onAddReaction(emoji.native);
  };

  return (
    <div className={cn(
      "group flex gap-3 px-4 py-2 hover:bg-muted/50 transition-colors relative",
      isReply && "pl-12"
    )}>
      <Avatar className="h-9 w-9 shrink-0 mt-0.5">
        <AvatarImage src={message.userAvatar} />
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm truncate">{message.userName}</span>
          <span className="text-[10px] text-muted-foreground">
            {message.createdAt ? format(message.createdAt.toDate(), "HH:mm", { locale: ptBR }) : "..."}
          </span>
        </div>

        <div className="text-sm text-foreground break-words whitespace-pre-wrap">
          {message.text}
        </div>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {message.attachments.map((file, i) => (
              <a 
                key={i}
                href={file.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-background border p-2 rounded-lg text-xs hover:border-primary transition-colors max-w-[200px]"
              >
                <FileIcon className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">{file.name}</span>
                <Download className="h-3 w-3 shrink-0 text-muted-foreground ml-auto" />
              </a>
            ))}
          </div>
        )}

        {/* Reactions */}
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {Object.entries(message.reactions).map(([emoji, userIds]) => {
              const hasReacted = userIds.includes(user?.uid || "");
              return (
                <button
                  key={emoji}
                  onClick={() => hasReacted ? onRemoveReaction(emoji) : onAddReaction(emoji)}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs border transition-all",
                    hasReacted 
                      ? "bg-primary/10 border-primary text-primary" 
                      : "bg-muted/50 border-transparent hover:border-muted-foreground/30"
                  )}
                >
                  <span>{emoji}</span>
                  <span className="font-bold">{userIds.length}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Reply indicator */}
        {!isReply && message.replyCount && message.replyCount > 0 && (
          <button 
            onClick={onReply}
            className="flex items-center gap-1.5 mt-2 text-xs font-bold text-primary hover:underline"
          >
            <MessageSquareReply className="h-3.5 w-3.5" />
            {message.replyCount} {message.replyCount === 1 ? "resposta" : "respostas"}
          </button>
        )}
      </div>

      {/* Message Actions (Hidden by default, shown on hover) */}
      <div className="absolute right-4 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-background border rounded-md shadow-sm p-0.5">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Smile className="h-4 w-4 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent side="top" align="end" className="p-0 border-none w-auto">
            <Picker 
              data={data} 
              onEmojiSelect={handleEmojiSelect} 
              theme="auto"
              previewPosition="none"
              skinTonePosition="none"
            />
          </PopoverContent>
        </Popover>

        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onReply}>
          <MessageSquareReply className="h-4 w-4 text-muted-foreground" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-xs">Copiar Texto</DropdownMenuItem>
            {isOwner && (
              <DropdownMenuItem className="text-xs text-destructive">Excluir</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
