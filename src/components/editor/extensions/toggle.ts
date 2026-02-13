import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ToggleView } from "./toggle-view";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    toggle: {
      setToggle: () => ReturnType;
    };
  }
}

export const ToggleExtension = Node.create({
  name: "toggle",
  group: "block",
  content: "block+",

  addAttributes() {
    return {
      title: {
        default: "Toggle",
        parseHTML: (element) => element.getAttribute("data-toggle-title") || "Toggle",
        renderHTML: (attributes) => ({
          "data-toggle-title": attributes.title,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-toggle-title]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { class: "toggle-block" }), 0];
  },

  addCommands() {
    return {
      setToggle:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { title: "Toggle" },
            content: [{ type: "paragraph" }],
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ToggleView);
  },
});
