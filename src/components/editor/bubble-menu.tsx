"use client";

import { useState, useCallback } from "react";
import { BubbleMenu } from "@tiptap/react/menus";
import type { Editor } from "@tiptap/core";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link,
  Highlighter,
  Sparkles,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface EditorBubbleMenuProps {
  editor: Editor;
  onImproveWithAI?: () => void;
}

export function EditorBubbleMenu({ editor, onImproveWithAI }: EditorBubbleMenuProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const shouldShow = useCallback(
    ({ editor: e }: { editor: Editor }) => {
      if (e.isActive("image")) return false;
      const { from, to } = e.state.selection;
      return from !== to;
    },
    []
  );

  function handleSetLink() {
    if (!linkUrl) {
      editor.chain().focus().unsetLink().run();
    } else {
      const url = linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`;
      editor.chain().focus().setLink({ href: url }).run();
    }
    setLinkUrl("");
    setShowLinkInput(false);
  }

  function handleLinkClick() {
    const previousUrl = editor.getAttributes("link").href || "";
    setLinkUrl(previousUrl);
    setShowLinkInput(true);
  }

  if (showLinkInput) {
    return (
      <BubbleMenu
        editor={editor}
        shouldShow={shouldShow}
        className="flex items-center gap-1 rounded-md border bg-popover p-1 shadow-md"
      >
        <input
          type="url"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSetLink();
            }
            if (e.key === "Escape") {
              setShowLinkInput(false);
            }
          }}
          placeholder="https://..."
          className="h-7 w-48 bg-transparent px-2 text-sm outline-none"
          autoFocus
        />
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSetLink}>
          <Check className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => setShowLinkInput(false)}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </BubbleMenu>
    );
  }

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={shouldShow}
      className="flex items-center gap-0.5 rounded-md border bg-popover p-1 shadow-md"
    >
      <BubbleButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        title="Negrito (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </BubbleButton>
      <BubbleButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        title="Itálico (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </BubbleButton>
      <BubbleButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive("underline")}
        title="Sublinhado (Ctrl+U)"
      >
        <Underline className="h-4 w-4" />
      </BubbleButton>
      <BubbleButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
        title="Tachado"
      >
        <Strikethrough className="h-4 w-4" />
      </BubbleButton>
      <BubbleButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive("code")}
        title="Código"
      >
        <Code className="h-4 w-4" />
      </BubbleButton>
      <BubbleButton
        onClick={handleLinkClick}
        isActive={editor.isActive("link")}
        title="Link"
      >
        <Link className="h-4 w-4" />
      </BubbleButton>
      <BubbleButton
        onClick={() => editor.chain().focus().toggleHighlight({ color: "#fef08a" }).run()}
        isActive={editor.isActive("highlight")}
        title="Destaque"
      >
        <Highlighter className="h-4 w-4" />
      </BubbleButton>

      {onImproveWithAI && (
        <>
          <Separator orientation="vertical" className="mx-1 h-6" />
          <BubbleButton onClick={onImproveWithAI} title="Melhorar com IA">
            <Sparkles className="h-4 w-4 text-emerald-500" />
          </BubbleButton>
        </>
      )}
    </BubbleMenu>
  );
}

function BubbleButton({
  children,
  onClick,
  isActive,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  isActive?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex h-7 w-7 items-center justify-center rounded-sm hover:bg-accent ${isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
        }`}
    >
      {children}
    </button>
  );
}
