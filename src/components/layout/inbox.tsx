"use client";

import React, { useState, useEffect } from "react";
import { 
  Bell, 
  AtSign, 
  MessageSquareReply, 
  Heart,
  Check,
  ExternalLink
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { subscribeToInbox, markAsRead } from "@/lib/firebase/chat";
import { ChatInboxItem } from "@/types/chat";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export function Inbox() {
  const { user } = useAuth();
  const [items, setItems] = useState<ChatInboxItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToInbox(user.uid, setItems);
    return () => unsub();
  }, [user]);

  const handleItemClick = async (item: ChatInboxItem) => {
    await markAsRead(item.id);
    setIsOpen(false);
    // Navigate to the message
    // In a real app, we would need the projectId to navigate correctly
    // For now, let's assume we can navigate to the channel at least if we have projectId
    // Since ChatInboxItem doesn't have projectId, we might need to add it or fetch it.
    // For now, just mark as read.
  };

  const getIcon = (type: ChatInboxItem['type']) => {
    switch (type) {
      case 'mention': return <AtSign className="h-4 w-4 text-primary" />;
      case 'reply': return <MessageSquareReply className="h-4 w-4 text-blue-500" />;
      case 'reaction': return <Heart className="h-4 w-4 text-rose-500" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getLabel = (type: ChatInboxItem['type']) => {
    switch (type) {
      case 'mention': return "Mencionou você";
      case 'reply': return "Respondeu sua mensagem";
      case 'reaction': return "Reagiu à sua mensagem";
      default: return "Nova notificação";
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {items.length > 0 && (
            <span className="absolute top-1 right-1 h-4 min-w-[16px] px-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-background">
              {items.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 shadow-xl border-muted/50">
        <div className="p-4 border-b flex items-center justify-between bg-muted/20">
          <h3 className="font-bold text-sm">Notificações</h3>
          {items.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 text-xs"
              onClick={() => items.forEach(item => markAsRead(item.id))}
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>
        <ScrollArea className="h-80">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground opacity-50">
              <Bell className="h-8 w-8 mb-2" />
              <p className="text-sm">Tudo lido por aqui!</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="flex gap-3 p-4 text-left hover:bg-muted/50 transition-colors border-b last:border-0 relative group"
                >
                  <div className="mt-1">{getIcon(item.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none mb-1">
                      {getLabel(item.type)}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      Clique para ver a mensagem
                    </p>
                    <span className="text-[10px] text-muted-foreground mt-2 block">
                      {format(item.createdAt.toDate(), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-primary/10 p-1.5 rounded-full">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="p-2 border-t text-center">
          <Button variant="link" size="sm" className="text-xs h-7">Ver histórico completo</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
