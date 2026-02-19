import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { TableKit } from "@tiptap/extension-table";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { common, createLowlight } from "lowlight";
import { CalloutExtension } from "./callout";
import { ToggleExtension } from "./toggle";
import { AIBlockExtension } from "./ai-block";
import { BacklinkExtension } from "./backlink";
import { MathInline } from "./math-inline";
import { MathBlock } from "./math-block";
import { PdfAnnotatorExtension } from "./pdf-annotator";

const lowlight = createLowlight(common);

export function getEditorExtensions(placeholder?: string) {
  return [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3],
      },
      codeBlock: false,
      link: false,
      underline: false,
    }),
    Placeholder.configure({
      placeholder: placeholder || "Comece a escrever ou pressione '/' para comandos...",
    }),
    Underline,
    Highlight.configure({
      multicolor: true,
    }),
    TextAlign.configure({
      types: ["heading", "paragraph"],
    }),
    Link.configure({
      openOnClick: false,
      autolink: true,
    }),
    Image.configure({
      allowBase64: true,
      HTMLAttributes: {
        class: "editor-image",
      },
    }),
    CodeBlockLowlight.configure({
      lowlight,
    }),
    TableKit.configure({
      table: {
        resizable: true,
        cellMinWidth: 100,
        allowTableNodeSelection: true,
      },
    }),
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    TextStyle,
    Color,
    CalloutExtension,
    ToggleExtension,
    AIBlockExtension,
    BacklinkExtension,
    MathInline,
    MathBlock,
    PdfAnnotatorExtension,
  ];
}

export { lowlight };
