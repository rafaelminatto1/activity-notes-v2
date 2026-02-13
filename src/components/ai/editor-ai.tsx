"use client";

import { useState } from "react";
import {
  Sparkles,
  FileText,
  Expand,
  Wand2,
  Languages,
  MessageSquare,
  CheckCheck,
  Type,
  Eraser,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AIDropdownProps {
  onSummarize: () => void;
  onExpand: () => void;
  onImprove: () => void;
  onSimplify: () => void;
  onFixSpelling: () => void;
  onTranslate: (language: string) => void;
  onChangeTone: (tone: string) => void;
  onFreePrompt: (prompt: string) => void;
  usage: { count: number; remaining: number; limit: number };
  loading: boolean;
}

const languages = [
  { label: "Inglês", value: "English" },
  { label: "Espanhol", value: "Spanish" },
  { label: "Francês", value: "French" },
  { label: "Alemão", value: "German" },
  { label: "Italiano", value: "Italian" },
  { label: "Português", value: "Portuguese" },
  { label: "Japonês", value: "Japanese" },
];

const tones = [
  { label: "Formal", value: "formal" },
  { label: "Informal", value: "informal" },
  { label: "Profissional", value: "profissional" },
  { label: "Amigável", value: "amigável" },
  { label: "Acadêmico", value: "acadêmico" },
];

export function AIDropdown({
  onSummarize,
  onExpand,
  onImprove,
  onSimplify,
  onFixSpelling,
  onTranslate,
  onChangeTone,
  onFreePrompt,
  usage,
  loading,
}: AIDropdownProps) {
  const [promptOpen, setPromptOpen] = useState(false);
  const usagePercent = Math.round((usage.count / usage.limit) * 100);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-purple-600 dark:text-purple-400"
            disabled={loading || usage.remaining <= 0}
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">IA</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {/* Usage progress */}
          <div className="px-2 py-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{usage.remaining} restantes</span>
              <span>{usage.count}/{usage.limit}</span>
            </div>
            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-purple-500 transition-all"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onSummarize} disabled={loading}>
            <FileText className="mr-2 h-4 w-4" />
            Resumir
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExpand} disabled={loading}>
            <Expand className="mr-2 h-4 w-4" />
            Expandir
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onImprove} disabled={loading}>
            <Wand2 className="mr-2 h-4 w-4" />
            Melhorar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onSimplify} disabled={loading}>
            <Eraser className="mr-2 h-4 w-4" />
            Simplificar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onFixSpelling} disabled={loading}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Corrigir ortografia
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger disabled={loading}>
              <Languages className="mr-2 h-4 w-4" />
              Traduzir
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.value}
                  onClick={() => onTranslate(lang.value)}
                >
                  {lang.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger disabled={loading}>
              <Type className="mr-2 h-4 w-4" />
              Alterar tom
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {tones.map((tone) => (
                <DropdownMenuItem
                  key={tone.value}
                  onClick={() => onChangeTone(tone.value)}
                >
                  {tone.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setPromptOpen(true)} disabled={loading}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Prompt livre
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AIPromptDialog
        open={promptOpen}
        onOpenChange={setPromptOpen}
        onSubmit={onFreePrompt}
        loading={loading}
      />
    </>
  );
}

interface AIPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (prompt: string) => void;
  loading: boolean;
}

function AIPromptDialog({ open, onOpenChange, onSubmit, loading }: AIPromptDialogProps) {
  const [prompt, setPrompt] = useState("");

  function handleSubmit() {
    if (!prompt.trim()) return;
    onSubmit(prompt);
    setPrompt("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Prompt livre</DialogTitle>
          <DialogDescription>
            Descreva o que a IA deve fazer com o texto selecionado ou com o contexto atual.
          </DialogDescription>
        </DialogHeader>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ex: Reescreva de forma mais formal..."
          className="min-h-[100px] w-full resize-none rounded-md border border-input bg-transparent p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!prompt.trim() || loading}>
            <Sparkles className="mr-2 h-4 w-4" />
            Gerar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
