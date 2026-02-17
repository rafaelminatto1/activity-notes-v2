import { Document } from "@/types/document";

export function exportToMarkdown(doc: Document) {
  const content = doc.plainText || "";
  const header = `# ${doc.title || "Sem título"}

`;
  const metadata = `---
date: ${new Date(doc.updatedAt.toMillis()).toISOString()}
id: ${doc.id}
---

`;

  const blob = new Blob([header + metadata + content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${doc.title || "nota"}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToJson(doc: Document) {
  const data = JSON.stringify(doc, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${doc.title || "nota"}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
