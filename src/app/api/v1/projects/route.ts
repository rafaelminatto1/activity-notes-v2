import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/api/auth";
import { getUserProjects, createProject } from "@/lib/firebase/projects";

export async function GET(request: NextRequest) {
  const { userId, error } = await authenticateApi(request);
  if (error) return error;

  const projects = await getUserProjects(userId!);
  return NextResponse.json({ data: projects });
}

export async function POST(request: NextRequest) {
  const { userId, error } = await authenticateApi(request);
  if (error) return error;

  const body = await request.json();
  const { name, icon, color } = body;

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  try {
    const projectId = await createProject({
      name,
      icon: icon || "📁",
      color: color || "#6366f1",
      userId: userId!,
    });
    
    return NextResponse.json({ data: { id: projectId, name } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Creation failed" }, { status: 500 });
  }
}
