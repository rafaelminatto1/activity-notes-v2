"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAIStore } from "@/stores/ai-store";
import {
  Send,
  Trash2,
  Sparkles,
  Copy,
  ClipboardPaste,
} from "lucide-react";
import { toast } from "sonner";

interface AIPanelProps {
  onChat: (message: string, context: string) => Promise<string>;
  onInsertToDocument?: (text: string) => void;
  documentContext: string;
  loading: boolean;
  usage: { count: number; remaining: number; limit: number };
}

const QUICK_PROMPTS = [
  "Resuma este documento",
  "Liste os pontos principais",
  "Sugira melhorias",
  "Gere um título",
  "Crie um resumo executivo",
];

export function AIPanel({
  onChat,
  onInsertToDocument,
  documentContext,
  loading,
  usage,
}: AIPanelProps) {
  const { panelOpen, closePanel, messages, addMessage, clearMessages, chatLoading, setChatLoading } =
    useAIStore();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, chatLoading]);

  // Focus input when panel opens
  useEffect(() => {
    if (panelOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [panelOpen]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || chatLoading) return;

      setInput("");
      addMessage("user", trimmed);
      setChatLoading(true);

      try {
        const result = await onChat(trimmed, documentContext);
        addMessage("assistant", result);
      } catch {
        addMessage("assistant", "Desculpe, ocorreu um erro ao processar sua mensagem.");
      } finally {
        setChatLoading(false);
      }
    },
    [chatLoading, onChat, documentContext, addMessage, setChatLoading]
  );

  const handleSubmit = useCallback(() => {
    sendMessage(input);
  }, [input, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  }, []);

  const usagePercent = Math.round((usage.count / usage.limit) * 100);

  return (
    <Sheet open={panelOpen} onOpenChange={(open) => !open && closePanel()}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader className="border-b pb-3">
          <div className="flex items-center justify-between pr-8">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <SheetTitle>Assistente IA</SheetTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearMessages}
              className="h-8 w-8 p-0"
              title="Limpar conversa"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <SheetDescription className="sr-only">
            Chat com assistente de IA para obter ajuda com seu documento.
          </SheetDescription>
        </SheetHeader>

        {/* Usage bar */}
        <div className="px-4 py-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{usage.remaining} usos restantes hoje</span>
            <span>{usage.count}/{usage.limit}</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-purple-500 transition-all"
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-4">
          <div ref={scrollRef} className="flex flex-col gap-3 py-3">
            {messages.length === 0 && !chatLoading && (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <Sparkles className="h-10 w-10 text-muted-foreground/50" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Como posso ajudar?
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    Faça perguntas sobre seu documento ou peça ajuda para escrever.
                  </p>
                </div>
                {/* Quick prompts */}
                <div className="flex flex-wrap justify-center gap-2">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      className="rounded-full border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-purple-300 hover:text-purple-600 dark:hover:border-purple-700 dark:hover:text-purple-400"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`relative max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-purple-600 text-white"
                      : "bg-muted text-foreground"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.role === "assistant" && (
                    <div className="mt-2 flex gap-1">
                      <button
                        onClick={() => copyToClipboard(msg.content)}
                        className="rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground"
                        title="Copiar"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      {onInsertToDocument && (
                        <button
                          onClick={() => {
                            onInsertToDocument(msg.content);
                            toast.success("Inserido no documento!");
                          }}
                          className="rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground"
                          title="Inserir no documento"
                        >
                          <ClipboardPaste className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {chatLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                  <Spinner className="h-3 w-3" />
                  Pensando...
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input area */}
        <div className="border-t p-4">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte algo sobre seu documento..."
              rows={1}
              className="max-h-32 min-h-[40px] flex-1 resize-none rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500"
              disabled={chatLoading || loading || usage.remaining <= 0}
            />
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!input.trim() || chatLoading || loading || usage.remaining <= 0}
              className="h-10 w-10 shrink-0 bg-purple-600 p-0 hover:bg-purple-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground">
            Enter para enviar, Shift+Enter para nova linha
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
