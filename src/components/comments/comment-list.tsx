"use client";

import { useEffect, useState } from "react";
import { subscribeToComments, deleteComment } from "@/lib/firebase/comments";
import { CommentItem } from "./comment-item";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare } from "lucide-react";
import type { Comment } from "@/types/smart-note";
import { toast } from "sonner";

interface CommentListProps {
  documentId: string;
}

export function CommentList({ documentId }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!documentId) return;
    
    return subscribeToComments(documentId, (data) => {
      setComments(data);
      setIsLoading(false);
    });
  }, [documentId]);

  const handleDelete = async (id: string) => {
    try {
      await deleteComment(id);
      toast.success("Comentário removido");
    } catch {
      toast.error("Erro ao remover comentário");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4 p-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 opacity-40">
        <MessageSquare className="w-12 h-12" />
        <p className="text-sm font-medium">Nenhum comentário ainda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 pb-20">
      {comments.map((comment) => (
        <CommentItem 
          key={comment.id} 
          comment={comment} 
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}
