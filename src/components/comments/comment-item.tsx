"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  MessageSquare, 
  MoreHorizontal, 
  Trash2, 
  ClipboardList, 
  ExternalLink,
  CheckCircle2
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { Comment } from "@/types/smart-note";
import { ConvertToTaskModal } from "./convert-to-task-modal";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";

interface CommentItemProps {
  comment: Comment;
  onDelete?: (id: string) => void;
}

export function CommentItem({ comment, onDelete }: CommentItemProps) {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const initials = comment.userName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";

  return (
    <div className="group relative flex gap-4 p-4 rounded-2xl bg-card hover:bg-accent/5 border border-transparent hover:border-primary/10 transition-all duration-300">
      <Avatar className="w-10 h-10 border-2 border-background shadow-sm shrink-0">
        <AvatarImage src={comment.userAvatar} />
        <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-2 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-2 min-w-0">
            <span className="font-bold text-sm truncate">{comment.userName}</span>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {comment.createdAt?.toDate ? 
                formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true, locale: ptBR }) : 
                "agora"}
            </span>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!comment.taskId && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-primary"
                onClick={() => setIsModalOpen(true)}
                title="Converter em Tarefa"
              >
                <ClipboardList className="w-4 h-4" />
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
                <DropdownMenuItem 
                  className="text-destructive font-medium focus:text-destructive gap-2"
                  onClick={() => onDelete?.(comment.id)}
                  disabled={user?.uid !== comment.userId}
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir Comentário
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {comment.selection?.text && (
          <div className="text-[10px] font-bold text-primary/60 uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-full w-fit">
            Em destaque: "{comment.selection.text}"
          </div>
        )}

        <p className="text-sm leading-relaxed text-foreground/90 break-words whitespace-pre-wrap">
          {comment.content}
        </p>

        {comment.taskId && (
          <div className="mt-3">
            <Link href={`/tasks/${comment.taskId}`}>
              <Badge variant="secondary" className="gap-1.5 px-3 py-1 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer group/badge">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                <span className="text-xs font-bold">Tarefa Vinculada</span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover/badge:opacity-50 transition-opacity" />
              </Badge>
            </Link>
          </div>
        )}
      </div>

      <ConvertToTaskModal
        comment={comment}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
