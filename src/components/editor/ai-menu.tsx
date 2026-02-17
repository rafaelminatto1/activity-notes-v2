"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { 
  Sparkles, 
  Wand2, 
  Languages, 
  AlignLeft, 
  CheckCheck, 
  Zap, 
  MoreHorizontal,
  Eraser,
  List
} from "lucide-react";
import { Editor } from "@tiptap/core";
import { useEditorAI } from "@/hooks/use-editor-ai";

interface AIMenuProps {
  editor: Editor;
  children: React.ReactNode;
}

export function AIMenu({ editor, children }: AIMenuProps) {
  const ai = useEditorAI(editor);

  if (!editor) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-xs font-bold text-muted-foreground uppercase">
          Inteligência Artificial
        </DropdownMenuLabel>
        
        <DropdownMenuItem onClick={() => ai.improveSelection()}>
          <Wand2 className="mr-2 h-4 w-4" />
          Melhorar escrita
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => ai.fixSpelling()}>
          <CheckCheck className="mr-2 h-4 w-4" />
          Corrigir gramática
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => ai.summarizeSelection()}>
          <AlignLeft className="mr-2 h-4 w-4" />
          Resumir
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => ai.expandSelection()}>
          <Zap className="mr-2 h-4 w-4" />
          Expandir texto
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => ai.simplifySelection()}>
          <Eraser className="mr-2 h-4 w-4" />
          Simplificar
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => ai.makeList()}>
          <List className="mr-2 h-4 w-4" />
          Converter em lista
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Languages className="mr-2 h-4 w-4" />
            Traduzir
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => ai.translateSelection("English")}>
              Inglês
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => ai.translateSelection("Spanish")}>
              Espanhol
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => ai.translateSelection("French")}>
              Francês
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => ai.translateSelection("German")}>
              Alemão
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => ai.translateSelection("Portuguese")}>
              Português
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <MoreHorizontal className="mr-2 h-4 w-4" />
            Mudar tom
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => ai.changeTone("formal")}>
              Formal
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => ai.changeTone("casual")}>
              Casual
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => ai.changeTone("direct")}>
              Direto
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => ai.changeTone("friendly")}>
              Amigável
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

      </DropdownMenuContent>
    </DropdownMenu>
  );
}
