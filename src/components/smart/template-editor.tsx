"use client";

import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Template } from "@/types/smart-note";
import { IconPicker } from "@/components/shared/icon-picker";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";

interface TemplateEditorProps {
  template?: Partial<Template>;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Template>) => Promise<void>;
}

const CATEGORIES = [
  "Trabalho",
  "Pessoal",
  "Educação",
  "Produtividade",
  "Gestão",
  "Criatividade",
  "Desenvolvimento",
  "Agile",
  "Geral"
];

const COLORS = [
  { name: "Indigo", value: "#6366f1" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Emerald", value: "#10b981" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Red", value: "#ef4444" },
  { name: "Pink", value: "#ec4899" },
  { name: "Violet", value: "#8b5cf6" },
  { name: "Slate", value: "#475569" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Teal", value: "#14b8a6" },
];

export function TemplateEditor({
  template,
  isOpen,
  onClose,
  onSave,
}: TemplateEditorProps) {
  const [name, setName] = useState(template?.name || "");
  const [description, setDescription] = useState(template?.description || "");
  const [icon, setIcon] = useState(template?.icon || "📄");
  const [color, setColor] = useState(template?.color || "#6366f1");
  const [category, setCategory] = useState(template?.category || "Geral");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("O nome do template é obrigatório.");
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        name,
        description,
        icon,
        color,
        category,
        // content is usually passed from the editor or existing doc
        content: template?.content || { type: "doc", content: [] },
      });
      onClose();
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Erro ao salvar template.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {template?.id ? "Editar Template" : "Novo Template"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-2">
              <Label>Ícone</Label>
              <IconPicker value={icon} onChange={setIcon}>
                <Button variant="outline" className="h-12 w-12 text-2xl p-0">
                  {icon}
                </Button>
              </IconPicker>
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="name">Nome do Template</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Ata de Reunião Semanal"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Para que serve este template?"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cor de Destaque</Label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    className={`h-6 w-6 rounded-full border-2 transition-all ${
                      color === c.value ? "border-foreground scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c.value }}
                    onClick={() => setColor(c.value)}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Salvando..." : "Salvar Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
