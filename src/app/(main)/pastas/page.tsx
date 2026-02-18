"use client";

import { ProjectCrudPage } from "@/components/project/project-crud-page";

export default function PastasPage() {
  return (
    <ProjectCrudPage
      kind="folder"
      title="Pastas"
      emptyText="Você ainda não criou nenhuma pasta."
    />
  );
}
