import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { MathBlockView } from "./math-block-view";

export interface MathBlockOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mathBlock: {
      /**
       * Inserir um bloco de equação
       */
      setMathBlock: (options: { latex: string }) => ReturnType;
    };
  }
}

export const MathBlock = Node.create<MathBlockOptions>({
  name: "mathBlock",

  group: "block",

  atom: true,

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
        tag: 'div[data-type="math-block"]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "math-block", class: "math-block" }),
      0,
    ];
  },

  addCommands() {
    return {
      setMathBlock:
        (attributes) =>
        ({ chain }) => {
          return chain().insertContent({ type: this.name, attrs: attributes }).run();
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathBlockView);
  },
});
