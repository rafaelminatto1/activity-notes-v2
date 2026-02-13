"use client";

import { useEditorState } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  ListChecks,
  Image,
  Table,
  Minus,
  Info,
  ChevronRight,
  ChevronDown,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AIDropdown } from "@/components/ai/editor-ai";

interface ToolbarProps {
  editor: Editor;
  onImageUpload: () => void;
  aiProps: {
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
  };
}

const textColors = [
  { label: "Padrão", value: "" },
  { label: "Vermelho", value: "#ef4444" },
  { label: "Laranja", value: "#f97316" },
  { label: "Amarelo", value: "#eab308" },
  { label: "Verde", value: "#22c55e" },
  { label: "Azul", value: "#3b82f6" },
  { label: "Roxo", value: "#a855f7" },
  { label: "Rosa", value: "#ec4899" },
];

const highlightColors = [
  { label: "Nenhum", value: "" },
  { label: "Amarelo", value: "#fef08a" },
  { label: "Verde", value: "#bbf7d0" },
  { label: "Azul", value: "#bfdbfe" },
  { label: "Roxo", value: "#e9d5ff" },
  { label: "Rosa", value: "#fce7f3" },
  { label: "Laranja", value: "#fed7aa" },
  { label: "Vermelho", value: "#fecaca" },
];

export function Toolbar({ editor, onImageUpload, aiProps }: ToolbarProps) {
  const editorState = useEditorState({
    editor,
    selector: (ctx) => ({
      isBold: ctx.editor.isActive("bold"),
      isItalic: ctx.editor.isActive("italic"),
      isUnderline: ctx.editor.isActive("underline"),
      isStrike: ctx.editor.isActive("strike"),
      isCode: ctx.editor.isActive("code"),
      isH1: ctx.editor.isActive("heading", { level: 1 }),
      isH2: ctx.editor.isActive("heading", { level: 2 }),
      isH3: ctx.editor.isActive("heading", { level: 3 }),
      isCodeBlock: ctx.editor.isActive("codeBlock"),
      isBlockquote: ctx.editor.isActive("blockquote"),
      isAlignLeft: ctx.editor.isActive({ textAlign: "left" }),
      isAlignCenter: ctx.editor.isActive({ textAlign: "center" }),
      isAlignRight: ctx.editor.isActive({ textAlign: "right" }),
      isAlignJustify: ctx.editor.isActive({ textAlign: "justify" }),
      isBulletList: ctx.editor.isActive("bulletList"),
      isOrderedList: ctx.editor.isActive("orderedList"),
      isTaskList: ctx.editor.isActive("taskList"),
    }),
  });

  function getCurrentBlockLabel(): string {
    if (editorState.isH1) return "Título 1";
    if (editorState.isH2) return "Título 2";
    if (editorState.isH3) return "Título 3";
    if (editorState.isCodeBlock) return "Código";
    if (editorState.isBlockquote) return "Citação";
    return "Texto";
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-md border-b bg-background px-2 py-1">
      {/* Text formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editorState.isBold}
        tooltip="Negrito (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editorState.isItalic}
        tooltip="Itálico (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editorState.isUnderline}
        tooltip="Sublinhado (Ctrl+U)"
      >
        <Underline className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editorState.isStrike}
        tooltip="Tachado"
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editorState.isCode}
        tooltip="Código inline"
      >
        <Code className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Paragraph type dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
            {getCurrentBlockLabel()}
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => editor.chain().focus().setParagraph().run()}>
            Texto
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            Título 1
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            Título 2
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            Título 3
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
            Código
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            Citação
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Alignment */}
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        isActive={editorState.isAlignLeft}
        tooltip="Alinhar à esquerda"
      >
        <AlignLeft className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        isActive={editorState.isAlignCenter}
        tooltip="Centralizar"
      >
        <AlignCenter className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        isActive={editorState.isAlignRight}
        tooltip="Alinhar à direita"
      >
        <AlignRight className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("justify").run()}
        isActive={editorState.isAlignJustify}
        tooltip="Justificar"
      >
        <AlignJustify className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editorState.isBulletList}
        tooltip="Lista com marcadores"
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editorState.isOrderedList}
        tooltip="Lista numerada"
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        isActive={editorState.isTaskList}
        tooltip="Lista de tarefas"
      >
        <ListChecks className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Insert dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
            Inserir
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={onImageUpload}>
            <Image className="mr-2 h-4 w-4" />
            Imagem
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run()
            }
          >
            <Table className="mr-2 h-4 w-4" />
            Tabela
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().setHorizontalRule().run()}>
            <Minus className="mr-2 h-4 w-4" />
            Divisor
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
            <Code className="mr-2 h-4 w-4" />
            Bloco de código
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().setCallout("info").run()}>
            <Info className="mr-2 h-4 w-4" />
            Callout
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().setToggle().run()}>
            <ChevronRight className="mr-2 h-4 w-4" />
            Toggle
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Colors */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 gap-1">
            <Palette className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="start">
          <div className="space-y-3">
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Cor do texto</p>
              <div className="flex flex-wrap gap-1">
                {textColors.map((color) => (
                  <button
                    key={color.value || "default-text"}
                    type="button"
                    className="flex h-7 w-7 items-center justify-center rounded-md border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color.value || undefined }}
                    title={color.label}
                    onClick={() => {
                      if (color.value) {
                        editor.chain().focus().setColor(color.value).run();
                      } else {
                        editor.chain().focus().unsetColor().run();
                      }
                    }}
                  >
                    {!color.value && <span className="text-xs">A</span>}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Destaque</p>
              <div className="flex flex-wrap gap-1">
                {highlightColors.map((color) => (
                  <button
                    key={color.value || "no-highlight"}
                    type="button"
                    className="flex h-7 w-7 items-center justify-center rounded-md border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color.value || undefined }}
                    title={color.label}
                    onClick={() => {
                      if (color.value) {
                        editor.chain().focus().toggleHighlight({ color: color.value }).run();
                      } else {
                        editor.chain().focus().unsetHighlight().run();
                      }
                    }}
                  >
                    {!color.value && <span className="text-xs">✕</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* AI */}
      <AIDropdown {...aiProps} />
    </div>
  );
}

function ToolbarButton({
  children,
  onClick,
  isActive,
  tooltip,
}: {
  children: React.ReactNode;
  onClick: () => void;
  isActive?: boolean;
  tooltip?: string;
}) {
  const button = (
    <Button
      variant="ghost"
      size="sm"
      className={`h-8 w-8 p-0 ${isActive ? "bg-accent text-accent-foreground" : ""}`}
      onClick={onClick}
    >
      {children}
    </Button>
  );

  if (!tooltip) return button;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}
