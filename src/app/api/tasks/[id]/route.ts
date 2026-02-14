import { NextResponse } from "next/server";
import { getFirestore, doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

/**
 * Single Task API route handler
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Autenticação necessária" },
      { status: 401 }
    );
  }

  const { id } = await params;
  const body = await req.json();
  const db = getFirestore();
  const docRef = doc(db, "tasks", id);

  try {
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: "Not Found", message: "Tarefa não encontrada" },
        { status: 404 }
      );
    }

    const taskData = docSnap.data();

    // Verify ownership
    if (taskData.userId !== user.uid) {
      return NextResponse.json(
        { error: "Forbidden", message: "Sem permissão" },
        { status: 403 }
      );
    }

    const updateData: any = { updatedAt: new Date() };

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status === "done" && !taskData.completedAt) {
        updateData.completedAt = new Date();
      } else if (body.status !== "done") {
        updateData.completedAt = null;
      }
    }
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.dueDate !== undefined) {
      updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    }
    if (body.assigneeId !== undefined) updateData.assigneeId = body.assigneeId;
    if (body.documentId !== undefined) updateData.documentId = body.documentId;
    if (body.labels !== undefined) updateData.labels = body.labels;
    if (body.subtasks !== undefined) updateData.subtasks = body.subtasks;

    await updateDoc(docRef, updateData);

    const updatedDoc = await getDoc(docRef);
    const data = updatedDoc.data();

    if (!data) {
      return NextResponse.json(
        { error: "Not Found", message: "Tarefa não encontrada após atualização" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: id,
      ...data,
      dueDate: data.dueDate?.toDate?.() || data.dueDate,
      createdAt: data.createdAt?.toDate?.() || data.createdAt,
      completedAt: data.completedAt?.toDate?.() || data.completedAt,
    });
  } catch (error) {
    console.error("Update task error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Autenticação necessária" },
      { status: 401 }
    );
  }

  const { id } = await params;
  const db = getFirestore();
  const docRef = doc(db, "tasks", id);

  try {
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: "Not Found", message: "Tarefa não encontrada" },
        { status: 404 }
      );
    }

    const taskData = docSnap.data();

    // Verify ownership
    if (taskData.userId !== user.uid) {
      return NextResponse.json(
        { error: "Forbidden", message: "Sem permissão" },
        { status: 403 }
      );
    }

    await deleteDoc(docRef);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete task error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    );
  }
}
