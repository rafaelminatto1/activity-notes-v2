import { NextResponse } from "next/server";
import { getFirestore, collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, orderBy, arrayUnion, arrayRemove, runTransaction } from "firebase/firestore";

/**
 * Tags API route handler
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const documentId = searchParams.get("documentId");

  const db = getFirestore();

  try {
    if (documentId) {
      // Get tags for a specific document
      const docRef = doc(db, "documents", documentId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return NextResponse.json(
          { error: "Not Found", message: "Documento não encontrado" },
          { status: 404 }
        );
      }

      const tags = docSnap.data().tags || [];
      return NextResponse.json({ data: tags });
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Bad Request", message: "userId é obrigatório" },
        { status: 400 }
      );
    }

    // Get all tags used by user (from all documents)
    const documentsQuery = query(
      collection(db, "documents"),
      where("userId", "==", userId)
    );

    const snapshot = await getDocs(documentsQuery);
    const tagMap = new Map<string, { name: string; count: number; color?: string }>();

    for (const doc of snapshot.docs) {
      const tags = doc.data().tags || [];
      const tagColors = doc.data().tagColors || {};

      for (const tag of tags) {
        const existing = tagMap.get(tag);
        if (existing) {
          existing.count += 1;
        } else {
          tagMap.set(tag, {
            name: tag,
            count: 1,
            color: tagColors[tag],
          });
        }
      }
    }

    // Convert to array and sort by usage count
    const sortedTags = Array.from(tagMap.values()).sort((a, b) => b.count - a.count);

    return NextResponse.json({ data: sortedTags });
  } catch (error) {
    console.error("Tags API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const { documentId, tag, color, userId } = body;

  if (!documentId || !tag) {
    return NextResponse.json(
      { error: "Bad Request", message: "documentId e tag são obrigatórios" },
      { status: 400 }
    );
  }

  const db = getFirestore();
  const docRef = doc(db, "documents", documentId);

  try {
    await updateDoc(docRef, {
      tags: arrayUnion(tag),
      [`tagColors.${tag}`]: color || generateTagColor(tag),
      updatedAt: new Date(),
    });

    // Trigger auto-tagging AI function
    try {
      await fetch("https://us-central1-fisioflow-migration.cloudfunctions.net/autoTagging", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, userId }),
      });
    } catch (aiError) {
      console.error("Auto-tagging failed:", aiError);
    }

    const updatedDoc = await getDoc(docRef);
    const updatedData = updatedDoc.data();
    return NextResponse.json({
      data: {
        tags: updatedData?.tags || [],
        tagColors: updatedData?.tagColors || {},
      },
    });
  } catch (error) {
    console.error("Add tag error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    );
  }
}

/**
 * Update multiple tags at once for a document
 */
export async function PATCH(req: Request) {
  const body = await req.json();
  const { documentId, tags, tagColors, userId } = body;

  if (!documentId) {
    return NextResponse.json(
      { error: "Bad Request", message: "documentId é obrigatório" },
      { status: 400 }
    );
  }

  const db = getFirestore();
  const docRef = doc(db, "documents", documentId);

  try {
    const updateData: any = { updatedAt: new Date() };

    if (tags !== undefined) {
      updateData.tags = tags;
    }

    if (tagColors) {
      updateData.tagColors = tagColors;
    }

    await updateDoc(docRef, updateData);

    // Trigger auto-tagging AI function
    if (userId && tags) {
      try {
        await fetch("https://us-central1-fisioflow-migration.cloudfunctions.net/autoTagging", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentId, userId }),
        });
      } catch (aiError) {
        console.error("Auto-tagging failed:", aiError);
      }
    }

    const updatedDoc = await getDoc(docRef);
    const updatedData = updatedDoc.data();
    return NextResponse.json({
      data: {
        tags: updatedData?.tags || [],
        tagColors: updatedData?.tagColors || {},
      },
    });
  } catch (error) {
    console.error("Update tags error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    );
  }
}

/**
 * Remove a tag from a document
 */
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const documentId = searchParams.get("documentId");
  const tag = searchParams.get("tag");

  if (!documentId || !tag) {
    return NextResponse.json(
      { error: "Bad Request", message: "documentId e tag são obrigatórios" },
      { status: 400 }
    );
  }

  const db = getFirestore();
  const docRef = doc(db, "documents", documentId);

  try {
    await updateDoc(docRef, {
      tags: arrayRemove(tag),
      [`tagColors.${tag}`]: null, // Remove the color for this tag
      updatedAt: new Date(),
    });

    const updatedDoc = await getDoc(docRef);
    const updatedData = updatedDoc.data();
    return NextResponse.json({
      data: {
        tags: updatedData?.tags || [],
        tagColors: updatedData?.tagColors || {},
      },
    });
  } catch (error) {
    console.error("Remove tag error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    );
  }
}

// Helper function to generate consistent colors for tags
function generateTagColor(tag: string): string {
  const colors = [
    "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
    "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
    "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
    "#ec4899", "#f43f5e",
  ];

  // Generate a hash from the tag name
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Use the hash to pick a color
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}
