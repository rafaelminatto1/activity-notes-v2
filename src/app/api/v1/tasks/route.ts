import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/api/auth";
import { getTasks } from "@/lib/firebase/tasks";
import { triggerWebhooks } from "@/lib/firebase/webhooks";

import { db } from "@/lib/firebase/config";
import { collection as firestoreCollection, addDoc as firestoreAddDoc, serverTimestamp as firestoreTimestamp } from "firebase/firestore";

export async function GET(request: NextRequest) {
  const { userId, error } = await authenticateApi(request);
  if (error) return error;

  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const limitVal = parseInt(searchParams.get("limit") || "50");

  let tasks = await getTasks(userId!);

  if (status) tasks = tasks.filter(t => t.status === status);
  if (priority) tasks = tasks.filter(t => t.priority === priority);
  
  tasks = tasks.slice(0, limitVal);

  return NextResponse.json({ 
    data: tasks,
    meta: {
      count: tasks.length,
      limit: limitVal,
      status_filter: status,
      priority_filter: priority
    }
  });
}

export async function POST(request: NextRequest) {
  const { userId, error } = await authenticateApi(request);
  if (error) return error;

  const body = await request.json();
  const { title, description, status, priority, projectId } = body;

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const colRef = firestoreCollection(db!, "tasks");
  const newDoc = await firestoreAddDoc(colRef, {
    title,
    description: description || "",
    status: status || "todo",
    priority: priority || "medium",
    projectId: projectId || null,
    userId,
    createdAt: firestoreTimestamp(),
    updatedAt: firestoreTimestamp(),
  });

  const task = { id: newDoc.id, title, status, priority };
  
  await triggerWebhooks(userId!, "task.created", task, projectId);

  return NextResponse.json({ data: task }, { status: 201 });
}
