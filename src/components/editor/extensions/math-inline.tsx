import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { MathInlineView } from "./math-inline-view";

export interface MathInlineOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mathInline: {
      /**
       * Inserir uma equação inline
       */
      setMathInline: (options: { latex: string }) => ReturnType;
    };
  }
}

export const MathInline = Node.create<MathInlineOptions>({
  name: "mathInline",

  group: "inline",

  inline: true,

  selectable: true,

  draggable: true,

  addAttributes() {
    return {
      latex: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-latex"),
        renderHTML: (attributes) => ({
          "data-latex": attributes.latex,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="math-inline"]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, { "data-type": "math-inline", class: "math-inline" }),
      0,
    ];
  },

  addCommands() {
    return {
      setMathInline:
        (attributes) =>
        ({ chain }) => {
          return chain().insertContent({ type: this.name, attrs: attributes }).run();
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathInlineView);
  },
});
