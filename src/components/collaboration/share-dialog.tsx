"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCollaborationStore } from "@/stores/collaboration-store";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function ShareDialog() {
  const { user } = useAuth();
  const { addCollaborator, collaborators } = useCollaborationStore();
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !user) return;
    
    await addCollaborator(email, "editor", user.uid);
    setEmail("");
    // Keep dialog open to invite more
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Compartilhar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartilhar Documento</DialogTitle>
          <DialogDescription>
            Convide outras pessoas para colaborar neste documento.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleInvite} className="flex items-end gap-2 py-4">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="exemplo@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button type="submit">Convidar</Button>
        </form>

        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">Colaboradores ativos</h4>
          {collaborators.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ninguém mais está aqui.</p>
          ) : (
            <div className="space-y-2">
              {collaborators.map((collab) => (
                <div key={collab.id} className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={collab.avatar} />
                    <AvatarFallback>{collab.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{collab.name}</span>
                    <span className="text-xs text-muted-foreground">{collab.email}</span>
                  </div>
                  <span className="ml-auto text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                    Online
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
