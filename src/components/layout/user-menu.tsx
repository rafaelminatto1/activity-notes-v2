"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { LogOut, Settings, Sun, Moon, Monitor } from "lucide-react";
import { signOut } from "@/lib/firebase/auth";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { toast } from "sonner";

export function UserMenu() {
  const { user, userProfile } = useAuth();
  const { setTheme, theme } = useTheme();
  const router = useRouter();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  if (!user) return null;

  const displayName = userProfile?.displayName || user.displayName || "";
  const email = user.email || "";
  const avatarUrl = userProfile?.avatarUrl || user.photoURL || "";
  const initials = displayName
    ? displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : email[0]?.toUpperCase() || "?";

  async function handleLogout() {
    try {
      await signOut();
      router.push("/login");
    } catch {
      toast.error("Falha ao sair. Tente novamente.");
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-md p-1.5 hover:bg-accent transition-colors outline-none w-full">
            <Avatar className="h-6 w-6">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="text-[10px]">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-sm font-medium">
              {displayName || email}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[240px]">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Tema */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              {theme === "dark" ? (
                <Moon className="mr-2 h-4 w-4" />
              ) : theme === "light" ? (
                <Sun className="mr-2 h-4 w-4" />
              ) : (
                <Monitor className="mr-2 h-4 w-4" />
              )}
              Tema
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="mr-2 h-4 w-4" />
                Claro
                {theme === "light" && <span className="ml-auto text-xs text-muted-foreground">ativo</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="mr-2 h-4 w-4" />
                Escuro
                {theme === "dark" && <span className="ml-auto text-xs text-muted-foreground">ativo</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Monitor className="mr-2 h-4 w-4" />
                Sistema
                {theme === "system" && <span className="ml-auto text-xs text-muted-foreground">ativo</span>}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {/* Configurações */}
          <DropdownMenuItem onClick={() => router.push("/settings")}>
            <Settings className="mr-2 h-4 w-4" />
            Configurações
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Sair */}
          <DropdownMenuItem
            onClick={() => setShowLogoutDialog(true)}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Confirmação de Logout */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair da conta?</AlertDialogTitle>
            <AlertDialogDescription>
              Você será desconectado e redirecionado para a página de login.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>
              Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
