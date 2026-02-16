import { NextResponse } from "next/server";
import { getFirestore, collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, orderBy, limit } from "firebase/firestore";
import { getAuth } from "firebase/auth";

/**
 * Tasks API route handler
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Autenticação necessária" },
      { status: 401 }
    );
  }

  const db = getFirestore();
  const userId = user.uid;

  try {
    const tasksQuery = query(
      collection(db, "tasks"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(100)
    );

    const snapshot = await getDocs(tasksQuery);
    const tasks = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        dueDate: data.dueDate?.toDate?.() || data.dueDate,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        completedAt: data.completedAt?.toDate?.() || data.completedAt,
      };
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Tasks API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Autenticação necessária" },
      { status: 401 }
    );
  }

  const body = await req.json();
  const { title, description, status, priority, dueDate, assigneeId, documentId, labels, subtasks } = body;

  if (!title) {
    return NextResponse.json(
      { error: "Bad Request", message: "title é obrigatório" },
      { status: 400 }
    );
  }

  const db = getFirestore();

  try {
    const docRef = await addDoc(collection(db, "tasks"), {
      title,
      description: description || "",
      status: status || "todo",
      priority: priority || "medium",
      dueDate: dueDate ? new Date(dueDate) : null,
      assigneeId: assigneeId || null,
      documentId: documentId || null,
      labels: labels || [],
      subtasks: subtasks || [],
      userId: user.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: null,
    });

    const createdDoc = await getDoc(docRef);
    const data = createdDoc.data();

    if (!data) {
      return NextResponse.json(
        { error: "Not Found", message: "Tarefa não encontrada após criação" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: docRef.id,
      ...data,
      dueDate: data.dueDate?.toDate?.() || data.dueDate,
      createdAt: data.createdAt?.toDate?.() || data.createdAt,
      completedAt: data.completedAt?.toDate?.() || data.completedAt,
    });
  } catch (error) {
    console.error("Create task error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    );
  }
}
