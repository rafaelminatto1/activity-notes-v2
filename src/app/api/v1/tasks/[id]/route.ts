import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/api/auth";
import { updateTask, deleteTask } from "@/lib/firebase/tasks";
import { triggerWebhooks } from "@/lib/firebase/webhooks";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, error } = await authenticateApi(request);
  if (error) return error;

  const { id } = await params;
  const body = await request.json();

  try {
    await updateTask(id, body);
    await triggerWebhooks(userId!, "task.updated", { id, ...body });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, error } = await authenticateApi(request);
  if (error) return error;

  const { id } = await params;

  try {
    await deleteTask(id);
    await triggerWebhooks(userId!, "task.deleted", { id });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
