"use client";

import { ProjectCrudPage } from "@/components/project/project-crud-page";

export default function CadernosPage() {
  return (
    <ProjectCrudPage
      kind="notebook"
      title="Cadernos"
      emptyText="Você ainda não criou nenhum caderno."
    />
  );
}
