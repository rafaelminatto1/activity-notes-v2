import { NextResponse } from "next/server";
import { getFirestore, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";

interface BacklinkRequest {
  addBacklink?: string;
  removeBacklink?: string;
}

/**
 * Manage document backlinks
 * PATCH - Add or remove a backlink reference
 * GET - Get all backlinks for a document
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

    const body: BacklinkRequest = await req.json();
    const currentBacklinks = docSnap.data().backlinks || [];

    const updateData: any = {};

    if (body.addBacklink) {
      // Add backlink if not already present
      if (!currentBacklinks.includes(body.addBacklink)) {
        updateData.backlinks = arrayUnion(body.addBacklink);
      }
    }

    if (body.removeBacklink) {
      // Remove backlink
      updateData.backlinks = arrayRemove(body.removeBacklink);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ data: { backlinks: currentBacklinks } });
    }

    await updateDoc(docRef, updateData);

    const updatedDoc = await getDoc(docRef);
    const updatedData = updatedDoc.data();
    return NextResponse.json({
      data: {
        backlinks: updatedData?.backlinks || [],
      },
    });
  } catch (error) {
    console.error("Backlink API error:", error);
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

    const backlinks = docSnap.data().backlinks || [];

    // Fetch full document data for each backlink
    const backlinkDocs = await Promise.all(
      backlinks.map(async (backlinkId: string) => {
        const backlinkRef = doc(db, "documents", backlinkId);
        const backlinkSnap = await getDoc(backlinkRef);
        if (backlinkSnap.exists()) {
          const data = backlinkSnap.data();
          return {
            id: backlinkId,
            title: data.title || "Sem título",
            updatedAt: data.updatedAt?.toDate?.() || data.createdAt?.toDate?.(),
          };
        }
        return null;
      })
    );

    // Filter out null entries
    const validBacklinks = backlinkDocs.filter((doc): doc is NonNullable<typeof doc> => doc !== null);

    return NextResponse.json({ data: validBacklinks });
  } catch (error) {
    console.error("Get backlinks API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    );
  }
}
