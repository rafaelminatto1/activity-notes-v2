"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import {
  Settings,
  Moon,
  Sun,
  Monitor,
  Camera,
  Download,
  Trash2,
  User,
  Palette,
  Sparkles,
  Shield,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  updateUserProfile,
  getDocumentsByParent,
  deleteDocumentPermanently,
} from "@/lib/firebase/firestore";
import {
  updateUserAuthProfile,
  changePassword,
  deleteUserAccount,
  isEmailProvider,
} from "@/lib/firebase/auth";
import { uploadImage } from "@/lib/firebase/storage";
import { getAIUsage } from "@/lib/ai/usage-tracker";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trackThemeChanged } from "@/lib/firebase/analytics";
import { toast } from "sonner";
import type { UserSettings } from "@/types/user";

export default function SettingsPage() {
  const { user, userProfile, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  // Profile state
  const [displayName, setDisplayName] = useState(userProfile?.displayName || "");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const nameTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Delete account state
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  // AI usage
  const [aiUsage, setAIUsage] = useState(() => getAIUsage());

  useEffect(() => {
    if (userProfile?.displayName) {
      setDisplayName(userProfile.displayName);
    }
  }, [userProfile?.displayName]);

  useEffect(() => {
    setAIUsage(getAIUsage());
  }, []);

  const settings: UserSettings = userProfile?.settings || {
    theme: "system",
    defaultView: "list",
    fontSize: "medium",
    contentWidth: "medium",
    aiEnabled: true,
    aiPreferredModel: "flash",
    aiResponseLanguage: "pt-BR",
  };

  const saveSetting = useCallback(
    async (key: keyof UserSettings, value: string | boolean) => {
      if (!user) return;
      try {
        await updateUserProfile(user.uid, {
          settings: { ...settings, [key]: value },
        });
        await refreshProfile();
      } catch {
        toast.error("Falha ao salvar configuração.");
      }
    },
    [user, settings, refreshProfile]
  );

  // --- Profile handlers ---

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setAvatarUploading(true);
    try {
      const url = await uploadImage(file, user.uid, "avatars");
      await updateUserAuthProfile(undefined, url);
      await updateUserProfile(user.uid, { avatarUrl: url });
      await refreshProfile();
      toast.success("Avatar atualizado.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao enviar avatar.");
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setDisplayName(value);

    if (nameTimeoutRef.current) clearTimeout(nameTimeoutRef.current);
    nameTimeoutRef.current = setTimeout(async () => {
      if (!user) return;
      try {
        await updateUserAuthProfile(value);
        await updateUserProfile(user.uid, { displayName: value });
        await refreshProfile();
      } catch {
        toast.error("Falha ao salvar nome.");
      }
    }, 1000);
  }

  // --- Theme handler ---

  function handleThemeChange(newTheme: "light" | "dark" | "system") {
    document.documentElement.classList.add("transition-colors");
    setTheme(newTheme);
    saveSetting("theme", newTheme);
    trackThemeChanged(newTheme);
    setTimeout(() => {
      document.documentElement.classList.remove("transition-colors");
    }, 300);
  }

  // --- Password handler ---

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setPasswordLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast.success("Senha alterada com sucesso.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao alterar senha.");
    } finally {
      setPasswordLoading(false);
    }
  }

  // --- Export data handler ---

  async function handleExportData() {
    if (!user) return;
    try {
      const allDocs = await getAllUserDocuments(user.uid);
      const blob = new Blob(
        [JSON.stringify({ profile: userProfile, documents: allDocs }, null, 2)],
        { type: "application/json" }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `activity-notes-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Dados exportados com sucesso.");
    } catch {
      toast.error("Falha ao exportar dados.");
    }
  }

  // --- Delete account handler ---

  async function handleDeleteAccount() {
    if (!user || deleteConfirmText !== "EXCLUIR") return;
    setDeleting(true);
    try {
      // Delete all documents
      const rootDocs = await getDocumentsByParent(user.uid, null);
      for (const doc of rootDocs) {
        await deleteDocumentPermanently(doc.id);
      }
      // Delete auth account (Firestore profile cleanup can be handled by a Cloud Function)
      await deleteUserAccount();
      toast.success("Conta excluída.");
      router.push("/login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao excluir conta.");
      setDeleting(false);
    }
  }

  const initials = (userProfile?.displayName || user?.email || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="mx-auto max-w-2xl p-8">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Configurações</h1>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="w-full">
          <TabsTrigger value="profile" className="flex-1 gap-1.5">
            <User className="h-4 w-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex-1 gap-1.5">
            <Palette className="h-4 w-4" />
            Aparência
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex-1 gap-1.5">
            <Sparkles className="h-4 w-4" />
            IA
          </TabsTrigger>
          <TabsTrigger value="account" className="flex-1 gap-1.5">
            <Shield className="h-4 w-4" />
            Conta
          </TabsTrigger>
        </TabsList>

        {/* ===== Profile Tab ===== */}
        <TabsContent value="profile" className="mt-6 space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="relative group"
              disabled={avatarUploading}
            >
              <Avatar className="h-20 w-20">
                <AvatarImage src={userProfile?.avatarUrl} alt={displayName} />
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-5 w-5 text-white" />
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </button>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                Clique na foto para alterar
              </p>
              {avatarUploading && (
                <p className="text-xs text-muted-foreground">Enviando...</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Display name */}
          <div className="space-y-2">
            <Label>Nome de exibição</Label>
            <Input
              value={displayName}
              onChange={handleNameChange}
              placeholder="Seu nome"
            />
          </div>

          {/* Email (readonly) */}
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input
              value={user?.email || ""}
              disabled
              className="opacity-60"
            />
          </div>

          {/* Plan badge */}
          <div className="space-y-2">
            <Label>Plano</Label>
            <div>
              <Badge variant={userProfile?.plan === "pro" ? "default" : "secondary"}>
                {userProfile?.plan === "pro" ? "Pro" : "Free"}
              </Badge>
            </div>
          </div>
        </TabsContent>

        {/* ===== Appearance Tab ===== */}
        <TabsContent value="appearance" className="mt-6 space-y-8">
          {/* Theme */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Tema da Interface</Label>
            <div className="grid grid-cols-3 gap-3">
              <ThemeCard
                active={theme === "light"}
                onClick={() => handleThemeChange("light")}
                icon={<Sun className="h-5 w-5" />}
                label="Claro"
              />
              <ThemeCard
                active={theme === "dark"}
                onClick={() => handleThemeChange("dark")}
                icon={<Moon className="h-5 w-5" />}
                label="Escuro"
              />
              <ThemeCard
                active={theme === "system"}
                onClick={() => handleThemeChange("system")}
                icon={<Monitor className="h-5 w-5" />}
                label="Sistema"
              />
            </div>
          </div>

          <Separator />

          {/* Font size */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Tamanho da Fonte</Label>
            <div className="grid grid-cols-3 gap-3">
              {([
                { value: "small", label: "Pequeno", desc: "14px" },
                { value: "medium", label: "Médio", desc: "16px" },
                { value: "large", label: "Grande", desc: "18px" },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => saveSetting("fontSize", opt.value)}
                  className={`rounded-lg border-2 p-3 text-center transition-colors ${
                    settings.fontSize === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="font-medium text-sm">{opt.label}</div>
                  <div className="text-xs text-muted-foreground">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Content width */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Largura do Conteúdo</Label>
            <div className="grid grid-cols-3 gap-3">
              {([
                { value: "narrow", label: "Estreito", desc: "640px" },
                { value: "medium", label: "Médio", desc: "720px" },
                { value: "wide", label: "Largo", desc: "960px" },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => saveSetting("contentWidth", opt.value)}
                  className={`rounded-lg border-2 p-3 text-center transition-colors ${
                    settings.contentWidth === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="font-medium text-sm">{opt.label}</div>
                  <div className="text-xs text-muted-foreground">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ===== AI Tab ===== */}
        <TabsContent value="ai" className="mt-6 space-y-6">
          {/* AI enabled */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">IA habilitada</Label>
              <p className="text-sm text-muted-foreground">
                Ativar ou desativar funcionalidades de IA
              </p>
            </div>
            <Switch
              checked={settings.aiEnabled}
              onCheckedChange={(checked) => saveSetting("aiEnabled", checked)}
            />
          </div>

          <Separator />

          {/* Preferred model */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Modelo preferido</Label>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: "flash", label: "Flash Lite", desc: "Rápido e econômico" },
                { value: "pro", label: "Pro", desc: "Mais capaz e detalhado" },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => saveSetting("aiPreferredModel", opt.value)}
                  className={`rounded-lg border-2 p-3 text-left transition-colors ${
                    settings.aiPreferredModel === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="font-medium text-sm">{opt.label}</div>
                  <div className="text-xs text-muted-foreground">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Response language */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Idioma das respostas</Label>
            <Select
              value={settings.aiResponseLanguage}
              onValueChange={(value) => saveSetting("aiResponseLanguage", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt-BR">Português</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Usage */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Uso diário</Label>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{aiUsage.count} de {aiUsage.limit} usos</span>
                <span className="text-muted-foreground">
                  {aiUsage.remaining} restantes
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${Math.min(100, (aiUsage.count / aiUsage.limit) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ===== Account Tab ===== */}
        <TabsContent value="account" className="mt-6 space-y-8">
          {/* Change password (only for email users) */}
          {isEmailProvider() && (
            <>
              <div className="space-y-4">
                <Label className="text-base font-medium">Alterar senha</Label>
                <div className="space-y-3">
                  <Input
                    type="password"
                    placeholder="Senha atual"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <Input
                    type="password"
                    placeholder="Nova senha"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <Input
                    type="password"
                    placeholder="Confirmar nova senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <Button
                    onClick={handleChangePassword}
                    disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
                  >
                    {passwordLoading ? "Alterando..." : "Alterar senha"}
                  </Button>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Export data */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Exportar dados</Label>
            <p className="text-sm text-muted-foreground">
              Baixe todos os seus dados em formato JSON.
            </p>
            <Button variant="outline" onClick={handleExportData}>
              <Download className="mr-2 h-4 w-4" />
              Exportar dados
            </Button>
          </div>

          <Separator />

          {/* Delete account */}
          <div className="space-y-3">
            <Label className="text-base font-medium text-destructive">
              Excluir conta
            </Label>
            <p className="text-sm text-muted-foreground">
              Esta ação é irreversível. Todos os seus documentos e dados serão
              excluídos permanentemente.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir minha conta
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir conta permanentemente?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Todos os seus documentos, configurações e dados serão excluídos
                    permanentemente. Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2 py-2">
                  <Label>
                    Digite <strong>EXCLUIR</strong> para confirmar:
                  </Label>
                  <Input
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="EXCLUIR"
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeleteConfirmText("")}>
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== "EXCLUIR" || deleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? "Excluindo..." : "Excluir conta"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// --- Helper component ---

function ThemeCard({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
        active
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50"
      }`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

// --- Recursive doc fetcher ---

async function getAllUserDocuments(
  userId: string,
  parentId: string | null = null
): Promise<Record<string, unknown>[]> {
  const docs = await getDocumentsByParent(userId, parentId);
  const all: Record<string, unknown>[] = [];
  for (const doc of docs) {
    all.push(doc as unknown as Record<string, unknown>);
    if (doc.childCount > 0) {
      const children = await getAllUserDocuments(userId, doc.id);
      all.push(...children);
    }
  }
  return all;
}
