"use client";

import React, { useState, useRef, useEffect } from "react";
import { useEditorAI } from "@/hooks/use-editor-ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, X, Send, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export function Sidekick() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "Hello! I'm your AI Sidekick. How can I help you with your notes today?" },
    ]);
    const [input, setInput] = useState("");
    const { chatWithAI, loading } = useEditorAI(null); // Reusing existing hook
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
        setInput("");

        try {
            // In a real app, we would pass the current document context here
            // For now, we'll pass a generic context or ask the AI to be general
            const result = await chatWithAI(userMsg, "User is asking a general question about their notes.");
            setMessages((prev) => [...prev, { role: "assistant", content: result }]);
        } catch {
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "Sorry, I encountered an error processing your request." },
            ]);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="w-[350px] h-[500px] glass-card rounded-xl flex flex-col shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-3 border-b bg-background/50 backdrop-blur-sm">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                                    <Sparkles className="h-4 w-4 text-primary" />
                                </div>
                                <h3 className="font-semibold text-sm">AI Sidekick</h3>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setIsOpen(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Chat Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                            {messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "flex gap-3 text-sm",
                                        msg.role === "user" ? "flex-row-reverse" : "flex-row"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                                            msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                                        )}
                                    >
                                        {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                    </div>
                                    <div
                                        className={cn(
                                            "rounded-lg p-3 max-w-[80%]",
                                            msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                                        )}
                                    >
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex gap-3 text-sm">
                                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                        <Bot className="h-4 w-4" />
                                    </div>
                                    <div className="bg-muted rounded-lg p-3">Thinking...</div>
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSubmit} className="p-3 border-t bg-background/50 backdrop-blur-sm">
                            <div className="relative">
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask me anything..."
                                    className="pr-10 bg-background/50"
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    variant="ghost"
                                    className="absolute right-1 top-1 h-7 w-7 text-primary hover:text-primary/80 hover:bg-transparent"
                                    disabled={loading || !input.trim()}
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "h-12 w-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-300",
                    isOpen ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"
                )}
            >
                <Sparkles className="h-6 w-6" />
            </motion.button>
        </div>
    );
}
