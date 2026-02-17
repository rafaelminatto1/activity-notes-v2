import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/api/auth";
import { getDocument, updateDocument, deleteDocumentPermanently } from "@/lib/firebase/firestore";
import { triggerWebhooks } from "@/lib/firebase/webhooks";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId, error } = await authenticateApi(request);
  if (error) return error;

  const { id } = params;
  const doc = await getDocument(id);

  if (!doc || doc.userId !== userId) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  return NextResponse.json({ data: doc });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId, error } = await authenticateApi(request);
  if (error) return error;

  const body = await request.json();
  const { id } = params;

  try {
    const doc = await getDocument(id);
    if (!doc || doc.userId !== userId) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    await updateDocument(id, body);
    await triggerWebhooks(userId!, "document.updated", { id, ...body });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId, error } = await authenticateApi(request);
  if (error) return error;

  const { id } = params;

  try {
    const doc = await getDocument(id);
    if (!doc || doc.userId !== userId) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    await deleteDocumentPermanently(id);
    await triggerWebhooks(userId!, "document.deleted", { id });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
