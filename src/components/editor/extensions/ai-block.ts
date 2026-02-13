import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { AIBlockView } from "./ai-block-view";

export type AIBlockStatus = "loading" | "done" | "error";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    aiBlock: {
      setAIBlock: (attrs: { action: string }) => ReturnType;
    };
  }
}

export const AIBlockExtension = Node.create({
  name: "aiBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      status: {
        default: "loading" as AIBlockStatus,
      },
      result: {
        default: "",
      },
      action: {
        default: "",
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-ai-block]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-ai-block": "" }), 0];
  },

  addCommands() {
    return {
      setAIBlock:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { ...attrs, status: "loading" },
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(AIBlockView);
  },
});
