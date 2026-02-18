"use client";

import { UserPresence } from "@/hooks/use-collaboration";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CollaboratorsProps {
  users: UserPresence[];
}

export function Collaborators({ users }: CollaboratorsProps) {
  if (users.length === 0) return null;

  return (
    <div className="flex -space-x-2 overflow-hidden items-center ml-2">
      {users.map((user) => (
        <TooltipProvider key={user.uid}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div 
                className="relative inline-block h-6 w-6 rounded-full ring-2 ring-background transition-transform hover:scale-110 hover:z-10"
                style={{ borderColor: user.color }}
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user.photoURL} alt={user.name} />
                  <AvatarFallback className="text-[8px]" style={{ backgroundColor: user.color }}>
                    {user.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {/* Indicador de ativo */}
                <span className="absolute bottom-0 right-0 block h-1.5 w-1.5 rounded-full bg-green-500 ring-1 ring-white" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{user.name} (Online)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
      <span className="text-xs text-muted-foreground ml-2">
        {users.length} online
      </span>
    </div>
  );
}
