import { Metadata } from "next";
import { PreviewClient } from "./preview-client";

interface PreviewPageProps {
  params: Promise<{ documentId: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Preview — Activity Notes",
    description: "Leia documentos publicados no Activity Notes.",
  };
}

export default async function PublicPreviewPage({ params }: PreviewPageProps) {
  const { documentId } = await params;
  return <PreviewClient documentId={documentId} />;
}
