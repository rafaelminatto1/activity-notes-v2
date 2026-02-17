"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Palette, 
  ArrowLeft, 
  Monitor, 
  Sun, 
  Moon, 
  Check, 
  Type, 
  Layers, 
  RefreshCcw,
  Sparkles,
  ChevronRight
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "next-themes";
import { updateUserProfile } from "@/lib/firebase/firestore";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { UserSettings } from "@/types/user";

type PaletteId = "default" | "ocean" | "forest" | "sunset" | "lavender" | "midnight" | "custom";
type DensityId = "compact" | "normal" | "comfortable";
type FontId = "sans" | "serif" | "mono";

const PALETTES: { id: PaletteId; name: string; color: string; description: string }[] = [
  { id: "default", name: "Default", color: "#6366f1", description: "O clássico azul moderno." },
  { id: "ocean", name: "Ocean", color: "#3b82f6", description: "Tons de azul profundo e relaxante." },
  { id: "forest", name: "Forest", color: "#10b981", description: "Verde natureza para foco." },
  { id: "sunset", name: "Sunset", color: "#f59e0b", description: "Cores quentes e vibrantes." },
  { id: "lavender", name: "Lavender", color: "#8b5cf6", description: "Suavidade do roxo lavanda." },
  { id: "midnight", name: "Midnight", color: "#000000", description: "Escuro profundo com acentos neon." },
  { id: "custom", name: "Customizado", color: "linear-gradient(45deg, #f06, #4a90e2)", description: "Sua própria cor primária." },
];

const DENSITIES: { id: DensityId; name: string; description: string }[] = [
  { id: "compact", name: "Compacta", description: "Mais conteúdo, menos espaço." },
  { id: "normal", name: "Normal", description: "O equilíbrio perfeito." },
  { id: "comfortable", name: "Confortável", description: "Espaçoso e arejado." },
];

const FONTS: { id: FontId; name: string; description: string }[] = [
  { id: "sans", name: "Sans-serif", description: "Moderna e limpa (Geist)." },
  { id: "serif", name: "Serif", description: "Clássica e legível para leitura." },
  { id: "mono", name: "Monospace", description: "Foco técnico e estruturado." },
];

export default function AppearanceSettingsPage() {
  const router = useRouter();
  const { user, userProfile, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();

  const [currentPalette, setCurrentPalette] = useState<PaletteId>((userProfile?.settings?.colorPalette as PaletteId) || "default");
  const [currentDensity, setCurrentDensity] = useState<DensityId>((userProfile?.settings?.density as DensityId) || "normal");
  const [currentFont, setCurrentFont] = useState<FontId>((userProfile?.settings?.editorFont as FontId) || "sans");
  const [customColor, setCustomColor] = useState<string>("#6366f1");
  const [isSaving, setIsSaving] = useState(false);

  // Sync state with profile
  useEffect(() => {
    if (userProfile?.settings) {
      setCurrentPalette((userProfile.settings.colorPalette as PaletteId) || "default");
      setCurrentDensity((userProfile.settings.density as DensityId) || "normal");
      setCurrentFont((userProfile.settings.editorFont as FontId) || "sans");
    }
  }, [userProfile?.settings]);

  const applyPreview = useCallback((type: "palette" | "density" | "font" | "customColor", value: string) => {
    const html = document.documentElement;
    if (type === "palette") html.setAttribute("data-palette", value);
    if (type === "density") html.setAttribute("data-density", value);
    if (type === "font") html.setAttribute("data-font", value);
    if (type === "customColor") {
      html.style.setProperty("--custom-primary", value);
      // Simple logic for foreground based on brightness could go here
    }
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const newSettings: UserSettings = {
        theme: (theme as "light" | "dark" | "system") || "system",
        defaultView: (userProfile?.settings?.defaultView as "list" | "grid") || "list",
        fontSize: (userProfile?.settings?.fontSize as "small" | "medium" | "large") || "medium",
        contentWidth: (userProfile?.settings?.contentWidth as "narrow" | "medium" | "wide") || "medium",
        aiEnabled: userProfile?.settings?.aiEnabled ?? true,
        aiPreferredModel: (userProfile?.settings?.aiPreferredModel as "flash" | "pro") || "flash",
        aiResponseLanguage: userProfile?.settings?.aiResponseLanguage || "pt-BR",
        colorPalette: currentPalette as any,
        density: currentDensity as any,
        editorFont: currentFont as any,
      };
      
      await updateUserProfile(user.uid, { settings: newSettings });
      await refreshProfile();
      toast.success("Aparência atualizada com sucesso!");
    } catch (error) {
      console.error("Error saving appearance:", error);
      toast.error("Erro ao salvar configurações.");
    } finally {
      setIsSaving(false);
    }
  };

  const resetPreview = () => {
    if (userProfile?.settings) {
      applyPreview("palette", userProfile.settings.colorPalette || "default");
      applyPreview("density", userProfile.settings.density || "normal");
      applyPreview("font", userProfile.settings.editorFont || "sans");
      setCurrentPalette((userProfile.settings.colorPalette as PaletteId) || "default");
      setCurrentDensity((userProfile.settings.density as DensityId) || "normal");
      setCurrentFont((userProfile.settings.editorFont as FontId) || "sans");
    }
  };

  return (
    <div className="mx-auto max-w-5xl p-4 space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => {
            resetPreview();
            router.push("/settings");
          }}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Palette className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Aparência</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={resetPreview} disabled={isSaving}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Resetar
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Theme Mode */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Modo do Tema</h2>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "light", name: "Claro", icon: Sun },
                { id: "dark", name: "Escuro", icon: Moon },
                { id: "system", name: "Sistema", icon: Monitor },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setTheme(m.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all hover:bg-accent",
                    theme === m.id ? "border-primary bg-primary/5" : "border-border"
                  )}
                >
                  <m.icon className={cn("h-6 w-6", theme === m.id ? "text-primary" : "text-muted-foreground")} />
                  <span className="text-sm font-medium">{m.name}</span>
                </button>
              ))}
            </div>
          </section>

          <Separator />

          {/* Color Palettes */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Paleta de Cores</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {PALETTES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setCurrentPalette(p.id);
                    applyPreview("palette", p.id);
                  }}
                  className={cn(
                    "group relative flex flex-col items-start gap-2 rounded-xl border-2 p-4 transition-all hover:bg-accent text-left",
                    currentPalette === p.id ? "border-primary bg-primary/5" : "border-border"
                  )}
                >
                  <div className="flex w-full justify-between items-center">
                    <div 
                      className="h-6 w-6 rounded-full border border-black/10 shadow-sm" 
                      style={{ background: p.color }}
                    />
                    {currentPalette === p.id && <Check className="h-4 w-4 text-primary" />}
                  </div>
                  <div>
                    <div className="text-sm font-bold">{p.name}</div>
                    <div className="text-[10px] text-muted-foreground leading-tight mt-1">{p.description}</div>
                  </div>
                </button>
              ))}
            </div>

            {currentPalette === "custom" && (
              <div className="mt-4 p-4 border rounded-xl bg-accent/30 space-y-3 animate-in fade-in slide-in-from-top-2">
                <div className="text-sm font-medium">Escolha sua cor primária</div>
                <div className="flex items-center gap-4">
                  <input 
                    type="color" 
                    value={customColor} 
                    onChange={(e) => {
                      setCustomColor(e.target.value);
                      applyPreview("customColor", e.target.value);
                    }}
                    className="h-10 w-20 rounded cursor-pointer bg-transparent"
                  />
                  <div className="text-xs text-muted-foreground">
                    Isto atualizará os botões, links e destaques da interface.
                  </div>
                </div>
              </div>
            )}
          </section>

          <Separator />

          {/* Density & Font */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Densidade da UI</h2>
              </div>
              <div className="space-y-2">
                {DENSITIES.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      setCurrentDensity(d.id);
                      applyPreview("density", d.id);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg border p-3 transition-all hover:bg-accent text-left",
                      currentDensity === d.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"
                    )}
                  >
                    <div>
                      <div className="text-sm font-bold">{d.name}</div>
                      <div className="text-xs text-muted-foreground">{d.description}</div>
                    </div>
                    {currentDensity === d.id && <Check className="h-4 w-4 text-primary" />}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Type className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Fonte do Editor</h2>
              </div>
              <div className="space-y-2">
                {FONTS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setCurrentFont(f.id);
                      applyPreview("font", f.id);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg border p-3 transition-all hover:bg-accent text-left",
                      currentFont === f.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"
                    )}
                  >
                    <div>
                      <div className="text-sm font-bold">{f.name}</div>
                      <div className="text-xs text-muted-foreground">{f.description}</div>
                    </div>
                    {currentFont === f.id && <Check className="h-4 w-4 text-primary" />}
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Preview Card */}
        <div className="lg:col-start-3">
          <div className="sticky top-4 space-y-4">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Prévia em tempo real</h3>
            <div className="rounded-2xl border bg-card shadow-xl overflow-hidden aspect-[3/4] flex flex-col">
              <div className="h-8 border-b bg-muted/50 flex items-center px-3 gap-1.5">
                <div className="h-2 w-2 rounded-full bg-red-400" />
                <div className="h-2 w-2 rounded-full bg-yellow-400" />
                <div className="h-2 w-2 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 p-6 space-y-6 overflow-hidden">
                <div className="space-y-2">
                  <div className="h-8 bg-primary rounded-lg w-3/4" />
                  <div className="h-3 bg-muted rounded-md w-full" />
                  <div className="h-3 bg-muted rounded-md w-5/6" />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-foreground/10 rounded w-1/2" />
                      <div className="h-2 bg-foreground/5 rounded w-full" />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t flex flex-col gap-3">
                  <div className="h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-bold text-sm">
                    Botão Primário
                  </div>
                  <div className="h-10 bg-secondary rounded-xl flex items-center justify-center text-secondary-foreground font-bold text-sm border">
                    Botão Secundário
                  </div>
                </div>

                <div className="mt-auto pt-6 flex justify-center">
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-2 w-2 rounded-full bg-primary opacity-20" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-muted/50 p-4 rounded-xl space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-tighter text-muted-foreground">Dicas de Estilo</h4>
              <div className="flex items-center justify-between text-sm group cursor-pointer">
                <span>Explorar galeria</span>
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
