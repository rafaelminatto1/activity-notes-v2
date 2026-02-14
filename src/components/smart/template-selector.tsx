"use client";

import React, { useState, useEffect } from "react";
import { FileText, Sparkles, ChevronDown, Plus } from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  content?: any;
}

interface TemplateSelectorProps {
  onUseTemplate?: (template: Template) => void;
}

export function TemplateSelector({ onUseTemplate }: TemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await fetch("/api/templates");
      if (response.ok) {
        const userTemplates = await response.json();
        setTemplates(userTemplates);
      }
    } catch (error) {
      console.error("Failed to load templates:", error);
    }
  };

  const handleUseTemplate = async (template: Template) => {
    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${template.name} (copia)`,
          content: template.content,
          icon: template.icon,
        }),
      });

      if (response.ok) {
        const newDoc = await response.json();
        window.location.href = `/documents/${newDoc.id}`;
      }
    } catch (error) {
      console.error("Failed to use template:", error);
    }
  };

  const BUILTIN_TEMPLATES: Template[] = [
    {
      id: "blank",
      name: "Nota em branco",
      description: "Nota vazia",
      icon: "📝",
      category: "general",
      content: {
        type: "doc",
        content: [],
      },
    },
    {
      id: "meeting",
      name: "Ata de Reunião",
      description: "Estrutura para ata de reunião",
      icon: "👥",
      category: "meeting",
      content: {
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Ata de Reunião" }],
          },
          {
            type: "paragraph",
            content: [
              { type: "text", text: "Data: " },
              { type: "text", marks: [{ type: "bold" }], text: "Hora: " },
              { type: "text", text: "Local: " },
              { type: "text", text: "Participantes: " },
            ],
          },
          {
            type: "heading",
            attrs: { level: 3 },
            content: [{ type: "text", text: "Pauta" }],
          },
          {
            type: "heading",
            attrs: { level: 3 },
            content: [{ type: "text", text: "Decisões" }],
          },
          {
            type: "heading",
            attrs: { level: 3 },
            content: [{ type: "text", text: "Próximos Passos" }],
          },
        ],
      },
    },
    {
      id: "daily-note",
      name: "Diário",
      description: "Template para diário diário",
      icon: "📅",
      category: "personal",
      content: {
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "{date}" }],
          },
          {
            type: "heading",
            attrs: { level: 3 },
            content: [{ type: "text", text: "Humor" }],
          },
          {
            type: "bulletList",
            content: [
              {
                type: "listItem",
                content: [
                  { type: "paragraph", content: [{ type: "text", text: "Manhã:" }] },
                  { type: "paragraph", content: [{ type: "text", text: "Tarde:" }] },
                  { type: "paragraph", content: [{ type: "text", text: "Noite:" }] },
                ],
              },
            ],
          },
          {
            type: "heading",
            attrs: { level: 3 },
            content: [{ type: "text", text: "Acontecimentos do dia" }],
          },
        ],
      },
    },
    {
      id: "project-brief",
      name: "Brief de Projeto",
      description: "Brief inicial de projeto",
      icon: "🚀",
      category: "work",
      content: {
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Nome do Projeto" }],
          },
          {
            type: "heading",
            attrs: { level: 3 },
            content: [{ type: "text", text: "Descrição" }],
          },
          {
            type: "heading",
            attrs: { level: 3 },
            content: [{ type: "text", text: "Objetivos" }],
          },
          {
            type: "heading",
            attrs: { level: 3 },
            content: [{ type: "text", text: "Milestones" }],
          },
          {
            type: "bulletList",
            content: [
              { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Objetivo 1" }] }] },
              { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Objetivo 2" }] }] },
              { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Objetivo 3" }] }] },
            ],
          },
        ],
      },
    },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
      >
        <FileText size={16} />
        <span>Templates</span>
        <ChevronDown
          size={16}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-full mt-2 bg-popover p-4 rounded-lg shadow-lg border w-80 z-50">
          <div className="text-xs font-semibold mb-3 text-muted-foreground">
            Criar a partir de...
          </div>
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              Em branco
            </div>
            <button
              onClick={() => onUseTemplate?.(BUILTIN_TEMPLATES[0])}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm hover:bg-muted rounded-md"
            >
              {BUILTIN_TEMPLATES[0].icon && (
                <span className="text-xl">{BUILTIN_TEMPLATES[0].icon}</span>
              )}
              <span>{BUILTIN_TEMPLATES[0].name}</span>
            </button>

            <div className="text-xs font-medium text-muted-foreground mt-2 mb-2">
              Usar Template
            </div>
            {templates.length > 0 && (
              <div>
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleUseTemplate(template)}
                    className="flex items-center gap-3 w-full px-3 py-2 text-sm hover:bg-muted rounded-md"
                  >
                    {template.icon && (
                      <span className="text-xl">{template.icon}</span>
                    )}
                    <div className="flex-1">
                      <span className="text-sm font-medium">{template.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        ({template.category})
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-3 pt-2 border-t">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Gerenciar Templates
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
