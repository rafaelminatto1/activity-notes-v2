"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useLayoutEffect,
} from "react";
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import type { Editor } from "@tiptap/core";
import { trackSlashCommandUsed } from "@/lib/firebase/analytics";
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Image,
  Code,
  Table,
  Quote,
  Minus,
  Info,
  ChevronRight,
  Sparkles,
  FileText,
  Lightbulb,
  Languages,
  PenLine,
  Mail,
  Calendar,
  Network,
  Sigma,
  Workflow,
  FileUp,
} from "lucide-react";

interface SlashCommandItem {
  title: string;
  description: string;
  icon: React.ElementType;
  category: string;
  command: (editor: Editor) => void;
}

function getSlashCommandItems(onImageUpload: () => void): SlashCommandItem[] {
  return [
    // BASICO
    {
      title: "Texto",
      description: "Parágrafo de texto simples",
      icon: Type,
      category: "BÁSICO",
      command: (editor) => editor.chain().focus().setParagraph().run(),
    },
    {
      title: "Título 1",
      description: "Título grande",
      icon: Heading1,
      category: "BÁSICO",
      command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      title: "Título 2",
      description: "Título médio",
      icon: Heading2,
      category: "BÁSICO",
      command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      title: "Título 3",
      description: "Título pequeno",
      icon: Heading3,
      category: "BÁSICO",
      command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    // LISTAS
    {
      title: "Lista",
      description: "Lista com marcadores",
      icon: List,
      category: "LISTAS",
      command: (editor) => editor.chain().focus().toggleBulletList().run(),
    },
    {
      title: "Numerada",
      description: "Lista numerada",
      icon: ListOrdered,
      category: "LISTAS",
      command: (editor) => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      title: "Tarefas",
      description: "Lista de tarefas",
      icon: ListChecks,
      category: "LISTAS",
      command: (editor) => editor.chain().focus().toggleTaskList().run(),
    },
    // MIDIA
    {
      title: "Imagem",
      description: "Fazer upload de imagem",
      icon: Image,
      category: "MÍDIA",
      command: () => onImageUpload(),
    },
    {
      title: "PDF",
      description: "Upload e anotação de PDF",
      icon: FileUp,
      category: "MÍDIA",
      command: (editor) => {
        window.dispatchEvent(new CustomEvent("slash-pdf"));
        editor.chain().focus().run();
      },
    },
    {
      title: "Imagem (Anotar)",
      description: "Imagem com ferramentas de desenho",
      icon: Image,
      category: "MÍDIA",
      command: (editor) => {
        window.dispatchEvent(new CustomEvent("slash-image-annotate"));
        editor.chain().focus().run();
      },
    },
    // AVANÇADO
    {
      title: "Código",
      description: "Bloco de código com syntax",
      icon: Code,
      category: "AVANÇADO",
      command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
    },
    {
      title: "Tabela",
      description: "Inserir tabela 3x3",
      icon: Table,
      category: "AVANÇADO",
      command: (editor) =>
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    },
    {
      title: "Callout",
      description: "Bloco de destaque",
      icon: Info,
      category: "AVANÇADO",
      command: (editor) => editor.chain().focus().setCallout("info").run(),
    },
    {
      title: "Equação",
      description: "Bloco de equação LaTeX",
      icon: Sigma,
      category: "AVANÇADO",
      command: (editor) => editor.chain().focus().setMathBlock({ latex: "" }).run(),
    },
    {
      title: "Equação Inline",
      description: "LaTeX no meio do texto",
      icon: Sigma,
      category: "AVANÇADO",
      command: (editor) => editor.chain().focus().setMathInline({ latex: "" }).run(),
    },
    {
      title: "Toggle",
      description: "Conteúdo retrátil",
      icon: ChevronRight,
      category: "AVANÇADO",
      command: (editor) => editor.chain().focus().setToggle().run(),
    },
    {
      title: "Citação",
      description: "Bloco de citação",
      icon: Quote,
      category: "AVANÇADO",
      command: (editor) => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      title: "Divisor",
      description: "Linha horizontal",
      icon: Minus,
      category: "AVANÇADO",
      command: (editor) => editor.chain().focus().setHorizontalRule().run(),
    },
    // AÇÕES
    {
      title: "Email",
      description: "Rascunho de email",
      icon: Mail,
      category: "AÇÕES",
      command: (editor) => {
        editor.chain().focus().insertContent(`
          <h3>Assunto: [Assunto do Email]</h3>
          <p>Olá [Nome],</p>
          <p>[Corpo do email...]</p>
          <p>Atenciosamente,<br/>[Seu Nome]</p>
        `).run();
      },
    },
    {
      title: "Agenda",
      description: "Pauta de reunião",
      icon: Calendar,
      category: "AÇÕES",
      command: (editor) => {
        editor.chain().focus().insertContent(`
          <h3>📅 Pauta da Reunião</h3>
          <p><strong>Data:</strong> [Data]</p>
          <p><strong>Participantes:</strong> [Nomes]</p>
          <h4>Tópicos:</h4>
          <ul>
            <li>[Tópico 1]</li>
            <li>[Tópico 2]</li>
          </ul>
          <h4>Ações:</h4>
          <ul data-type="taskList">
            <li data-type="taskItem" data-checked="false"><div>[Ação 1]</div></li>
          </ul>
        `).run();
      },
    },
    {
      title: "Conectar Agenda",
      description: "Importar evento do Calendar",
      icon: Calendar,
      category: "AÇÕES",
      command: (editor) => {
        // Placeholder para integração real
        // Idealmente abriria um modal para selecionar o evento
        editor.chain().focus().insertContent(`
          <div class="bg-blue-50 p-4 rounded-lg border border-blue-200 my-4">
            <h3 class="text-blue-800 font-bold flex items-center gap-2">
              📅 Reunião: [Nome do Evento]
            </h3>
            <p class="text-sm text-blue-600">Conecte sua conta Google para sincronizar eventos.</p>
            <ul class="list-disc pl-5 mt-2 space-y-1 text-sm text-blue-800">
              <li><strong>Participantes:</strong> ...</li>
              <li><strong>Data:</strong> ${new Date().toLocaleDateString()}</li>
            </ul>
          </div>
        `).run();
      },
    },
    {
      title: "Ver Grafo",
      description: "Abrir visualização de grafo",
      icon: Network,
      category: "AÇÕES",
      command: () => {
        window.open("/graph", "_blank");
      },
    },
    // IA
    {
      title: "AI Assistente",
      description: "Pedir algo para a IA",
      icon: Sparkles,
      category: "IA",
      command: (editor) => {
        window.dispatchEvent(new CustomEvent("slash-ai", { detail: "freePrompt" }));
        editor.chain().focus().run();
      },
    },
    {
      title: "Gerar Diagrama",
      description: "Criar fluxograma com IA",
      icon: Workflow,
      category: "IA",
      command: (editor) => {
        window.dispatchEvent(new CustomEvent("slash-ai", { detail: "generateDiagram" }));
        editor.chain().focus().run();
      },
    },
    {
      title: "Continuar escrevendo",
      description: "IA continua o texto",
      icon: PenLine,
      category: "IA",
      command: (editor) => {
        window.dispatchEvent(new CustomEvent("slash-ai", { detail: "continueWriting" }));
        editor.chain().focus().run();
      },
    },
    {
      title: "Resumir",
      description: "IA resume o texto acima",
      icon: FileText,
      category: "IA",
      command: (editor) => {
        window.dispatchEvent(new CustomEvent("slash-ai", { detail: "summarizeAbove" }));
        editor.chain().focus().run();
      },
    },
    {
      title: "Gerar ideias",
      description: "IA sugere ideias",
      icon: Lightbulb,
      category: "IA",
      command: (editor) => {
        window.dispatchEvent(new CustomEvent("slash-ai", { detail: "generateIdeas" }));
        editor.chain().focus().run();
      },
    },
    {
      title: "Traduzir",
      description: "IA traduz o texto selecionado",
      icon: Languages,
      category: "IA",
      command: (editor) => {
        window.dispatchEvent(new CustomEvent("slash-ai", { detail: "translate" }));
        editor.chain().focus().run();
      },
    },
  ];
}

const slashPluginKey = new PluginKey("slashCommand");

export function createSlashCommandExtension(onImageUpload: () => void) {
  return Extension.create({
    name: "slashCommand",

    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: slashPluginKey,
          state: {
            init: () => ({ active: false, query: "", from: 0 }),
            apply(tr, prev) {
              const meta = tr.getMeta(slashPluginKey);
              if (meta) return meta;
              if (prev.active) {
                // Keep active, update query from doc
                const { from } = prev;
                const text = tr.doc.textBetween(from, tr.selection.from, "");
                return { active: true, query: text, from };
              }
              return prev;
            },
          },
          props: {
            handleKeyDown(view, event) {
              const state = slashPluginKey.getState(view.state);

              if (event.key === "/" && !state?.active) {
                const { from } = view.state.selection;
                // Check that we're at start of a text block or after whitespace
                const $from = view.state.doc.resolve(from);
                const textBefore = $from.parent.textBetween(
                  0,
                  $from.parentOffset,
                  undefined,
                  "\ufffc"
                );

                if (textBefore === "" || textBefore.endsWith(" ")) {
                  // Activate after the "/" is inserted
                  setTimeout(() => {
                    view.dispatch(
                      view.state.tr.setMeta(slashPluginKey, {
                        active: true,
                        query: "",
                        from: from + 1, // after the "/"
                      })
                    );
                  }, 0);
                }
                return false;
              }

              if (state?.active) {
                if (event.key === "Escape") {
                  view.dispatch(
                    view.state.tr.setMeta(slashPluginKey, {
                      active: false,
                      query: "",
                      from: 0,
                    })
                  );
                  return true;
                }
                if (event.key === "ArrowUp" || event.key === "ArrowDown" || event.key === "Enter") {
                  // Let the React component handle these
                  const customEvent = new CustomEvent("slash-key", {
                    detail: event.key,
                  });
                  window.dispatchEvent(customEvent);
                  return true;
                }
                if (event.key === "Backspace") {
                  // If query is empty, we're deleting the "/" so deactivate
                  if (state.query === "") {
                    view.dispatch(
                      view.state.tr.setMeta(slashPluginKey, {
                        active: false,
                        query: "",
                        from: 0,
                      })
                    );
                    return false; // let default backspace happen
                  }
                }
              }
              return false;
            },
          },
        }),
      ];
    },
  });
}

interface SlashCommandMenuProps {
  editor: Editor;
  onImageUpload: () => void;
}

export function SlashCommandMenu({ editor, onImageUpload }: SlashCommandMenuProps) {
  const [active, setActive] = useState(false);
  const [query, setQuery] = useState("");
  const [slashFrom, setSlashFrom] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const items = getSlashCommandItems(onImageUpload);

  const filteredItems = query
    ? items.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase())
      )
    : items;

  // Group items by category
  const grouped = filteredItems.reduce(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, SlashCommandItem[]>
  );

  // Watch plugin state
  useEffect(() => {
    if (!editor) return;

    function update() {
      const state = slashPluginKey.getState(editor.state);
      if (!state) return;

      if (state.active !== active) {
        setActive(state.active);
        if (state.active) {
          setSelectedIndex(0);
        }
      }
      if (state.query !== query) {
        setQuery(state.query);
        setSelectedIndex(0);
      }
      if (state.from !== slashFrom) {
        setSlashFrom(state.from);
      }
    }

    editor.on("transaction", update);
    return () => {
      editor.off("transaction", update);
    };
  }, [editor, active, query, slashFrom]);

  // Position the menu
  useLayoutEffect(() => {
    if (!active || !editor) return;

    try {
      const view = editor.view as EditorView;
      const coords = view.coordsAtPos(slashFrom);
      const editorRect = view.dom.closest(".editor-wrapper")?.getBoundingClientRect();
      if (editorRect) {
        setPosition({
          top: coords.bottom - editorRect.top + 4,
          left: coords.left - editorRect.left,
        });
      } else {
        setPosition({ top: coords.bottom + 4, left: coords.left });
      }
    } catch {
      // Position calculation can fail if pos is out of range
    }
  }, [active, slashFrom, editor]);

  // Handle keyboard events
  useEffect(() => {
    if (!active) return;

    function handleKey(e: Event) {
      const key = (e as CustomEvent).detail;
      if (key === "ArrowDown") {
        setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
      } else if (key === "ArrowUp") {
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
      } else if (key === "Enter") {
        executeCommand(selectedIndex);
      }
    }

    window.addEventListener("slash-key", handleKey);
    return () => window.removeEventListener("slash-key", handleKey);
  }, [active, selectedIndex, filteredItems.length]);

  const executeCommand = useCallback(
    (index: number) => {
      const item = filteredItems[index];
      if (!item) return;

      // Delete "/" and query text
      editor
        .chain()
        .focus()
        .deleteRange({ from: slashFrom - 1, to: editor.state.selection.from })
        .run();

      // Deactivate slash menu
      editor.view.dispatch(
        editor.state.tr.setMeta(slashPluginKey, {
          active: false,
          query: "",
          from: 0,
        })
      );

      // Execute the command
      item.command(editor);
      trackSlashCommandUsed(item.title);
    },
    [editor, filteredItems, slashFrom]
  );

  // Scroll selected item into view
  useEffect(() => {
    if (!menuRef.current) return;
    const selected = menuRef.current.querySelector("[data-selected='true']");
    selected?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (!active || filteredItems.length === 0) return null;

  let flatIndex = 0;

  return (
    <div
      ref={menuRef}
      className="absolute z-50 max-h-80 w-72 overflow-y-auto rounded-md border bg-popover p-1 shadow-lg"
      style={{ top: position.top, left: position.left }}
    >
      {Object.entries(grouped).map(([category, categoryItems]) => (
        <div key={category}>
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            {category}
          </div>
          {categoryItems.map((item) => {
            const currentIndex = flatIndex++;
            const Icon = item.icon;
            return (
              <button
                key={item.title}
                type="button"
                data-selected={currentIndex === selectedIndex}
                className={`flex w-full items-center gap-3 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent ${
                  currentIndex === selectedIndex ? "bg-accent text-accent-foreground" : ""
                }`}
                onClick={() => executeCommand(currentIndex)}
                onMouseEnter={() => setSelectedIndex(currentIndex)}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-background">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-medium">{item.title}</div>
                  <div className="text-xs text-muted-foreground">{item.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
