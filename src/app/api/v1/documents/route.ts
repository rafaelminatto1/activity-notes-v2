import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/api/auth";
import { createDocument, getDocumentsByParent } from "@/lib/firebase/firestore";
import { triggerWebhooks } from "@/lib/firebase/webhooks";

export async function GET(request: NextRequest) {
  const { userId, error } = await authenticateApi(request);
  if (error) return error;

  const docs = await getDocumentsByParent(userId!, null);
  return NextResponse.json({ data: docs });
}

export async function POST(request: NextRequest) {
  const { userId, error } = await authenticateApi(request);
  if (error) return error;

  const body = await request.json();
  const { title, content, workspaceId, projectId } = body;

  try {
    const docId = await createDocument(userId!, {
      title: title || "",
      content: content || null,
      workspaceId: workspaceId || "",
      projectId: projectId || null,
    });
    
    await triggerWebhooks(userId!, "document.created", { id: docId, title });
    
    return NextResponse.json({ data: { id: docId, title } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Creation failed" }, { status: 500 });
  }
}
