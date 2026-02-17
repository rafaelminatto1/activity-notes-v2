"use client";

import React, { useState, useRef } from "react";
import { 
  Send, 
  Smile, 
  Paperclip, 
  X, 
  FileIcon,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { uploadFile } from "@/lib/firebase/storage";
import { useAuth } from "@/hooks/use-auth";
import { ChatAttachment } from "@/types/chat";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  onSendMessage: (text: string, attachments?: ChatAttachment[]) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
}

export function MessageInput({ onSendMessage, placeholder = "Escreva uma mensagem...", disabled }: MessageInputProps) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [isSending, setIsSaving] = useState(false);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!text.trim() && attachments.length === 0) || isSending || isUploading) return;

    setIsSaving(true);
    try {
      await onSendMessage(text.trim(), attachments.length > 0 ? attachments : undefined);
      setText("");
      setAttachments([]);
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEmojiSelect = (emoji: { native: string }) => {
    setText(prev => prev + emoji.native);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    try {
      const url = await uploadFile(file, user.uid, "chat-attachments");
      const newAttachment: ChatAttachment = {
        name: file.name,
        url,
        type: file.type,
        size: file.size
      };
      setAttachments(prev => [...prev, newAttachment]);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="p-4 border-t bg-background">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {attachments.map((file, i) => (
            <div key={i} className="relative group bg-muted p-2 rounded-md flex items-center gap-2 pr-8">
              <FileIcon className="h-4 w-4 text-primary" />
              <span className="text-xs truncate max-w-[150px]">{file.name}</span>
              <button 
                onClick={() => removeAttachment(i)}
                className="absolute right-1 top-1 text-muted-foreground hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSend} className="flex items-end gap-2">
        <div className="flex-1 relative bg-muted rounded-xl flex flex-col">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={placeholder}
            className="w-full bg-transparent p-3 text-sm focus:outline-none resize-none min-h-[44px] max-h-[200px]"
            rows={1}
            disabled={disabled || isSending}
          />
          
          <div className="flex items-center gap-1 px-2 pb-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              className="hidden" 
            />
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground"
                >
                  <Smile className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent side="top" align="start" className="p-0 border-none w-auto">
                <Picker 
                  data={data} 
                  onEmojiSelect={handleEmojiSelect} 
                  theme="auto"
                  locale="pt"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <Button 
          type="submit" 
          size="icon" 
          disabled={(!text.trim() && attachments.length === 0) || isSending || isUploading || disabled}
          className={cn(
            "rounded-full h-11 w-11 transition-all",
            text.trim() ? "bg-primary scale-100" : "bg-muted scale-90"
          )}
        >
          {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </Button>
      </form>
    </div>
  );
}
