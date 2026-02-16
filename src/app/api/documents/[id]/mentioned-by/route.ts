import { NextResponse } from "next/server";
import { getFirestore, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";

interface MentionedByRequest {
  addMentionedBy?: string;
  removeMentionedBy?: string;
}

/**
 * Manage "mentioned by" references (documents that mention this document)
 * PATCH - Add or remove a "mentioned by" reference
 * GET - Get all documents that mention this document
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getFirestore();
  const docRef = doc(db, "documents", id);

  try {
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: "Not Found", message: "Documento não encontrado" },
        { status: 404 }
      );
    }

    const body: MentionedByRequest = await req.json();
    const currentMentionedBy = docSnap.data().mentionedBy || [];

    const updateData: any = {};

    if (body.addMentionedBy) {
      // Add "mentioned by" if not already present
      if (!currentMentionedBy.includes(body.addMentionedBy)) {
        updateData.mentionedBy = arrayUnion(body.addMentionedBy);
      }
    }

    if (body.removeMentionedBy) {
      // Remove "mentioned by"
      updateData.mentionedBy = arrayRemove(body.removeMentionedBy);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ data: { mentionedBy: currentMentionedBy } });
    }

    await updateDoc(docRef, updateData);

    const updatedDoc = await getDoc(docRef);
    const updatedData = updatedDoc.data();
    return NextResponse.json({
      data: {
        mentionedBy: updatedData?.mentionedBy || [],
      },
    });
  } catch (error) {
    console.error("Mentioned by API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getFirestore();
  const docRef = doc(db, "documents", id);

  try {
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: "Not Found", message: "Documento não encontrado" },
        { status: 404 }
      );
    }

    const mentionedBy = docSnap.data().mentionedBy || [];

    // Fetch full document data for each "mentioned by" reference
    const mentionedByDocs = await Promise.all(
      mentionedBy.map(async (mentionedById: string) => {
        const mentionedByRef = doc(db, "documents", mentionedById);
        const mentionedBySnap = await getDoc(mentionedByRef);
        if (mentionedBySnap.exists()) {
          const data = mentionedBySnap.data();
          return {
            id: mentionedById,
            title: data.title || "Sem título",
            updatedAt: data.updatedAt?.toDate?.() || data.createdAt?.toDate?.(),
          };
        }
        return null;
      })
    );

    // Filter out null entries
    const validMentionedBy = mentionedByDocs.filter((doc): doc is NonNullable<typeof doc> => doc !== null);

    return NextResponse.json({ data: validMentionedBy });
  } catch (error) {
    console.error("Get mentioned by API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    );
  }
}
