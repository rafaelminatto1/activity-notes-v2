"use client";

import { useState, useCallback, useEffect } from "react";
import { BubbleMenu } from "@tiptap/react/menus";
import type { Editor } from "@tiptap/core";
import {
  Table as TableIcon,
  PlusCircle,
  MinusCircle,
  Trash2,
  Rows,
  Columns,
  Merge,
  Split,
  Square,
  CheckSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TableControlsProps {
  editor: Editor;
}

export function TableControls({ editor }: TableControlsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);

  // Listen for custom event to open table dialog
  useEffect(() => {
    const handleOpenDialog = () => setIsDialogOpen(true);
    window.addEventListener("editor-open-table-dialog", handleOpenDialog);
    return () => window.removeEventListener("editor-open-table-dialog", handleOpenDialog);
  }, []);

  const insertTable = useCallback(() => {
    editor
      .chain()
      .focus()
      .insertTable({ rows, cols, withHeaderRow: true })
      .run();
    setIsDialogOpen(false);
  }, [editor, rows, cols]);

  const shouldShow = useCallback(
    ({ editor }: { editor: Editor }) => {
      return editor.isActive("table");
    },
    []
  );

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[300px]">
          <DialogHeader>
            <DialogTitle>Inserir Tabela</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rows" className="text-right">
                Linhas
              </Label>
              <Input
                id="rows"
                type="number"
                min={1}
                max={20}
                value={rows}
                onChange={(e) => setRows(parseInt(e.target.value) || 1)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cols" className="text-right">
                Colunas
              </Label>
              <Input
                id="cols"
                type="number"
                min={1}
                max={20}
                value={cols}
                onChange={(e) => setCols(parseInt(e.target.value) || 1)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={insertTable}>Inserir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BubbleMenu
        editor={editor}
        shouldShow={shouldShow}
        className="flex flex-wrap items-center gap-0.5 rounded-md border bg-popover p-1 shadow-md"
      >
        <div className="flex items-center gap-0.5 px-1">
          <TableActionButton
            onClick={() => editor.chain().focus().addColumnBefore().run()}
            tooltip="Adicionar coluna antes"
          >
            <PlusCircle className="h-3.5 w-3.5 rotate-90" />
            <Columns className="h-4 w-4" />
          </TableActionButton>
          <TableActionButton
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            tooltip="Adicionar coluna depois"
          >
            <Columns className="h-4 w-4" />
            <PlusCircle className="h-3.5 w-3.5" />
          </TableActionButton>
          <TableActionButton
            onClick={() => editor.chain().focus().deleteColumn().run()}
            tooltip="Remover coluna"
          >
            <Columns className="h-4 w-4 text-red-500" />
            <MinusCircle className="h-3.5 w-3.5 text-red-500" />
          </TableActionButton>
        </div>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <div className="flex items-center gap-0.5 px-1">
          <TableActionButton
            onClick={() => editor.chain().focus().addRowBefore().run()}
            tooltip="Adicionar linha antes"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <Rows className="h-4 w-4" />
          </TableActionButton>
          <TableActionButton
            onClick={() => editor.chain().focus().addRowAfter().run()}
            tooltip="Adicionar linha depois"
          >
            <Rows className="h-4 w-4" />
            <PlusCircle className="h-3.5 w-3.5" />
          </TableActionButton>
          <TableActionButton
            onClick={() => editor.chain().focus().deleteRow().run()}
            tooltip="Remover linha"
          >
            <Rows className="h-4 w-4 text-red-500" />
            <MinusCircle className="h-3.5 w-3.5 text-red-500" />
          </TableActionButton>
        </div>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <div className="flex items-center gap-0.5 px-1">
          <TableActionButton
            onClick={() => editor.chain().focus().mergeCells().run()}
            tooltip="Mesclar células"
          >
            <Merge className="h-4 w-4" />
          </TableActionButton>
          <TableActionButton
            onClick={() => editor.chain().focus().splitCell().run()}
            tooltip="Dividir célula"
          >
            <Split className="h-4 w-4" />
          </TableActionButton>
        </div>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <div className="flex items-center gap-0.5 px-1">
          <TableActionButton
            onClick={() => editor.chain().focus().toggleHeaderRow().run()}
            isActive={editor.isActive('table', { withHeaderRow: true })}
            tooltip="Cabeçalho da linha"
          >
            <CheckSquare className="h-4 w-4" />
          </TableActionButton>
          <TableActionButton
            onClick={() => editor.chain().focus().deleteTable().run()}
            tooltip="Excluir tabela"
            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
          >
            <Trash2 className="h-4 w-4" />
          </TableActionButton>
        </div>
      </BubbleMenu>
    </>
  );
}

function TableActionButton({
  children,
  onClick,
  isActive,
  tooltip,
  className = "",
}: {
  children: React.ReactNode;
  onClick: () => void;
  isActive?: boolean;
  tooltip: string;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          className={`flex items-center justify-center rounded-sm p-1.5 hover:bg-accent transition-colors ${
            isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
          } ${className}`}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}
