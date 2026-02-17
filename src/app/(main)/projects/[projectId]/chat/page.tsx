"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Hash, 
  Plus, 
  Settings, 
  MessageCircle,
  ArrowLeft
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { subscribeToChannels, createChannel } from "@/lib/firebase/chat";
import { getProject } from "@/lib/firebase/projects";
import { ChatChannel as ChannelType } from "@/types/chat";
import { Project } from "@/types/project";
import { Button } from "@/components/ui/button";
import { ChatChannel } from "@/components/chat/chat-channel";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ProjectChatPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const router = useRouter();
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [channels, setChannels] = useState<ChannelType[]>([]);
  const [activeChannel, setActiveChannel] = useState<ChannelType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newChannel, setNewChannel] = useState({
    name: "",
    description: ""
  });

  useEffect(() => {
    if (!user || !projectId) return;

    getProject(projectId).then(setProject);

    const unsub = subscribeToChannels(projectId, (data) => {
      setChannels(data);
      if (data.length > 0 && !activeChannel) {
        setActiveChannel(data[0]);
      }
      setIsLoading(false);
    });

    return () => unsub();
  }, [user, projectId, activeChannel]);

  const handleCreateChannel = async () => {
    if (!newChannel.name.trim() || !user || !projectId) return;

    try {
      await createChannel({
        projectId,
        name: newChannel.name.toLowerCase().replace(/\s+/g, "-"),
        description: newChannel.description,
        isPrivate: false,
        userId: user.uid
      });
      setIsModalOpen(false);
      setNewChannel({ name: "", description: "" });
      toast.success("Canal criado!");
    } catch {
      toast.error("Erro ao criar canal.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden bg-background">
      {/* Channels Sidebar */}
      <div className="w-64 border-r bg-muted/30 flex flex-col shrink-0">
        <div className="p-4 border-b bg-background flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/projects/${projectId}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="font-bold text-sm truncate">{project?.name || "Projeto"} Chat</h1>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 flex items-center justify-between group">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Canais</span>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => setActiveChannel(channel)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-all",
                activeChannel?.id === channel.id 
                  ? "bg-primary text-primary-foreground font-bold shadow-md" 
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Hash className="h-4 w-4 shrink-0" />
              <span className="truncate">{channel.name}</span>
            </button>
          ))}
          {channels.length === 0 && (
            <div className="text-center py-8 px-4">
              <p className="text-xs text-muted-foreground">Nenhum canal criado ainda.</p>
              <Button variant="link" size="sm" onClick={() => setIsModalOpen(true)}>Criar canal</Button>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 min-w-0">
        {activeChannel ? (
          <ChatChannel channel={activeChannel} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageCircle className="h-16 w-12 mb-4 opacity-20" />
            <h2 className="text-xl font-bold">Bem-vindo ao Chat</h2>
            <p className="text-sm">Selecione um canal para começar a conversar.</p>
          </div>
        )}
      </div>

      {/* New Channel Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Canal</DialogTitle>
            <DialogDescription>Crie um espaço para discussões específicas.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Canal</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="name" 
                  placeholder="ex: design-feedback" 
                  className="pl-9"
                  value={newChannel.name}
                  onChange={(e) => setNewChannel({...newChannel, name: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Descrição (opcional)</Label>
              <Input 
                id="desc" 
                placeholder="Sobre o que é este canal?" 
                value={newChannel.description}
                onChange={(e) => setNewChannel({...newChannel, description: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateChannel}>Criar Canal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
