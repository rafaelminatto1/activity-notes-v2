import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { CalloutView } from "./callout-view";

export type CalloutType = "info" | "warning" | "error" | "success";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (type?: CalloutType) => ReturnType;
    };
  }
}

export const CalloutExtension = Node.create({
  name: "callout",
  group: "block",
  content: "block+",

  addAttributes() {
    return {
      type: {
        default: "info" as CalloutType,
        parseHTML: (element) => element.getAttribute("data-callout-type") || "info",
        renderHTML: (attributes) => ({
          "data-callout-type": attributes.type,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-callout-type]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { class: "callout-block" }), 0];
  },

  addCommands() {
    return {
      setCallout:
        (type: CalloutType = "info") =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { type },
            content: [{ type: "paragraph" }],
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutView);
  },
});
