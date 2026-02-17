import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/api/auth";
import { getProject, updateProject, deleteProject } from "@/lib/firebase/projects";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId, error } = await authenticateApi(request);
  if (error) return error;

  const { id } = params;
  const project = await getProject(id);

  if (!project || project.userId !== userId) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ data: project });
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
    const project = await getProject(id);
    if (!project || project.userId !== userId) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await updateProject(id, body);
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
    const project = await getProject(id);
    if (!project || project.userId !== userId) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await deleteProject(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
