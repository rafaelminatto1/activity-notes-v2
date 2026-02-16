"use client";

import { useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGlobalQA, Source } from "@/hooks/use-global-qa";
import { Search, Sparkles, FileText, CornerDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface GlobalQAModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  messages: { role: "user" | "assistant"; content: string; sources?: Source[] }[];
  onAsk: (question: string) => void;
}

export function GlobalQAModal({
  isOpen,
  onClose,
  isLoading,
  messages,
  onAsk,
}: GlobalQAModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputRef.current?.value) {
      onAsk(inputRef.current.value);
      inputRef.current.value = "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden bg-background/95 backdrop-blur-xl border-emerald-500/20 shadow-2xl">
        <DialogHeader className="px-6 py-6 border-b bg-emerald-500/5 backdrop-blur-md">
          <DialogTitle className="flex items-center gap-2 text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
            <div className="p-1.5 bg-emerald-500 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            Ask Your Notes
          </DialogTitle>
          <DialogDescription className="text-muted-foreground/70 font-medium">
            Sua inteligência artificial pessoal treinada no seu próprio conhecimento.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea ref={scrollRef} className="h-[450px] p-6 bg-gradient-to-b from-background to-muted/20">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground opacity-50 space-y-4">
              <Search className="w-12 h-12" />
              <p>O que você gostaria de saber hoje?</p>
              <div className="flex flex-wrap justify-center gap-2 max-w-sm">
                {["Resuma minhas notas da semana", "Quais são minhas tarefas pendentes?", "Ideias para o projeto X"].map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    className="text-xs h-auto py-1.5"
                    onClick={() => onAsk(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-6">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex flex-col gap-2",
                  msg.role === "user" ? "items-end" : "items-start"
                )}
              >
                <div
                  className={cn(
                    "px-4 py-2.5 rounded-2xl max-w-[85%] text-sm shadow-md",
                    msg.role === "user"
                      ? "bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-br-none"
                      : "bg-background border border-emerald-500/10 text-foreground rounded-bl-none"
                  )}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>

                {/* Sources visualization */}
                {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
                  <div className="flex gap-2 flex-wrap max-w-[85%] mt-1">
                    {msg.sources.map((source) => (
                      <div
                        key={source.documentId}
                        className="flex items-center gap-1.5 px-2 py-1 bg-background border rounded-md text-xs text-muted-foreground hover:border-emerald-500/50 hover:text-emerald-600 transition-colors cursor-pointer"
                        title={`Relevância: ${Math.round(source.relevanceScore * 100)}%`}
                      >
                        <FileText className="w-3 h-3" />
                        <span className="truncate max-w-[100px]">{source.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start">
                <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-none flex gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-background">
          <form onSubmit={handleSubmit} className="relative">
            <Input
              ref={inputRef}
              placeholder="Faça uma pergunta..."
              className="pr-12 py-6 text-base bg-muted/50 border-transparent focus-visible:bg-background focus-visible:border-emerald-500/50 transition-all shadow-inner"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading}
              className="absolute right-1.5 top-1.5 h-9 w-9 bg-emerald-600 hover:bg-emerald-700 transition-transform active:scale-95"
            >
              <CornerDownLeft className="w-4 h-4" />
            </Button>
          </form>
          <div className="text-[10px] text-center text-muted-foreground mt-2 flex justify-center gap-4">
            <span>✨ Powered by Gemini 1.5 Flash</span>
            <span>🔒 Contexto Privado</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
