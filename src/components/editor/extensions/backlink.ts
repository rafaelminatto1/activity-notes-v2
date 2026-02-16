import { Node, mergeAttributes } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { PluginKey } from "@tiptap/pm/state";

const mentionPluginKey = new PluginKey("mention");

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
    ];
  },

  renderHTML({ node }) {
    return [
      "span",
      mergeAttributes({
        class: "mention bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded cursor-pointer hover:bg-emerald-200 transition-colors font-medium border border-emerald-200 dark:border-emerald-800",
        "data-mention": "true",
        "data-id": node.attrs.id,
        "data-label": node.attrs.label,
      }),
      `@${node.attrs.label}`,
    ];
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        char: "[[",
        pluginKey: mentionPluginKey,
        editor: this.editor,
        command: ({ editor, range, props }) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent([
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
        items: async ({ query }) => {
          if (!query) return [];
          try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=basic`);
            if (!response.ok) return [];
            const json = await response.json();
            return json.results.map((item: any) => ({
              id: item.documentId,
              label: item.title,
            }));
          } catch (e) {
            return [];
          }
        },
        render: () => {
          let component: HTMLDivElement | null = null;

          return {
            onStart: (props: any) => {
              component = document.createElement("div");
              component.className = "absolute z-50 bg-popover border rounded-md shadow-lg p-1 max-h-60 overflow-y-auto w-64";
              if (props.clientRect) {
                const rect = props.clientRect();
                component.style.setProperty("top", `${rect.bottom + 5}px`);
                component.style.setProperty("left", `${rect.left}px`);
              }
              document.body.appendChild(component);
            },
            onUpdate: (props: any) => {
              if (component && props.clientRect) {
                const rect = props.clientRect();
                component.style.setProperty("top", `${rect.bottom + 5}px`);
                component.style.setProperty("left", `${rect.left}px`);
              }
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
