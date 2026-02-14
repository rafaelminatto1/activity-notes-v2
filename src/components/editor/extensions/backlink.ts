import { Node, mergeAttributes } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { PluginKey } from "@tiptap/pm/state";

const mentionPluginKey = new PluginKey("mention");

// ============================================================
// Backlink Extension - Bi-directional linking using [[note]]
// ============================================================

export interface MentionNodeAttrs {
  id: string;
  label: string;
}

export const BacklinkExtension = Node.create({
  name: "mention",

  group: "inline",

  inline: true,

  atom: true,

  addAttributes() {
    return {
      id: {
        default: null,
      },
      label: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-mention]",
        getAttrs: (node: any) => ({
          id: node.getAttribute("data-id"),
          label: node.getAttribute("data-label"),
        }),
      },
      {
        tag: "span[data-type=mention]",
        getAttrs: (node: any) => ({
          id: node.getAttribute("data-id"),
          label: node.getAttribute("data-label"),
        }),
      },
    ];
  },

  renderHTML({ node }) {
    return [
      "span",
      mergeAttributes({
        class: "mention bg-primary/10 text-primary px-1.5 py-0.5 rounded cursor-pointer hover:bg-primary/20 transition-colors",
        "data-mention": "true",
        "data-type": "mention",
        "data-id": node.attrs.id,
        "data-label": node.attrs.label,
      }),
      node.attrs.label || node.attrs.id,
    ];
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        char: "[[",
        pluginKey: mentionPluginKey,
        editor: this.editor,
        allow: ({ editor }: { editor: any }) => {
          const isCodeBlock = editor.state.doc.firstChild?.type.name === "codeBlock";
          const isWithinCodeBlock = editor.state.selection.$from.parent.type.name === "codeBlock";
          return !isCodeBlock && !isWithinCodeBlock;
        },
        command: ({ editor, range, props }: { editor: any; range: any; props: any }) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContentAt(range, [
              {
                type: this.name,
                attrs: props,
              },
              {
                type: "text",
                text: " ",
              },
            ])
            .run();
        },
        items: async ({ query }: { query: string }) => {
          if (!query || query.length < 2) return [];

          try {
            const response = await fetch(`/api/search?type=semantic&search=${encodeURIComponent(query)}`);
            if (!response.ok) return [];

            const result = await response.json();
            const docs = result.data || [];

            return docs
              .filter((doc: any) => doc.documentTitle?.toLowerCase().includes(query.toLowerCase()))
              .slice(0, 10)
              .map((doc: any) => ({
                id: doc.id || doc.documentId,
                label: doc.documentTitle || "Sem titulo",
              }));
          } catch (error) {
            console.error("Failed to fetch mentions:", error);
            return [];
          }
        },
        render: () => {
          let component: HTMLDivElement | null = null;

          return {
            onStart: (props: any) => {
              component = document.createElement("div");
              component.className = "absolute z-50 bg-popover border rounded-md shadow-lg p-1 max-h-60 overflow-y-auto w-64";
              props.clientRect && component.style.setProperty("top", `${props.clientRect.top + 30}px`);
              props.clientRect && component.style.setProperty("left", `${props.clientRect.left}px`);
              document.body.appendChild(component);
            },
            onUpdate: (props: any) => {
              if (component && props.clientRect) {
                component.style.setProperty("top", `${props.clientRect.top + 30}px`);
                component.style.setProperty("left", `${props.clientRect.left}px`);
              }
            },
            onKeyDown: (props: any) => {
              if (props.event.key === "Escape") {
                props.editor.view.focus();
                return true;
              }
              return false;
            },
            onExit: () => {
              if (component) {
                component.remove();
                component = null;
              }
            },
          };
        },
      }),
    ];
  },
});
