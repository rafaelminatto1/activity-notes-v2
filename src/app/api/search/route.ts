import { NextResponse } from "next/server";
import { getFirestore, collection, query, where, orderBy, limit, getDocs, doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Cosine similarity for vector search
function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length === 0 || b.length === 0) return 0;

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
  }

  for (let i = 0; i < b.length; i++) {
    magnitudeB += b[i] * b[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) return 0;

  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Search API route handler
 */
export async function GET(req: Request) {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Autenticação necessária" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const type = searchParams.get("type");
  const tags = searchParams.get("tags")?.split(",");
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const dueDate = searchParams.get("dueDate");

  if (search && search.length < 2) {
    return NextResponse.json(
      { error: "Bad Request", message: "A busca deve ter pelo menos 2 caracteres" }
    );
  }

  const db = getFirestore();
  const userId = user.uid;

  try {
    switch (type) {
      case "semantic": {
        // Semantic search using vector embeddings
        if (!search || search.length < 2) {
          return NextResponse.json({ error: "Bad Request", message: "Query é obrigatória" });
        }

        // Get user's documents with embeddings
        const docsQuery = query(
          collection(db, "documents"),
          where("userId", "==", userId)
        );

        const docsSnapshot = await getDocs(docsQuery);
        const results: Array<{ id: string; score: number; documentTitle: string }> = [];

        for (const doc of docsSnapshot.docs) {
          const data = doc.data();
          if (data?.vectorEmbedding && data.vectorEmbedding.length > 0) {
            // Compare with the search term by checking if the title contains the search term
            const title = data.title || "";
            const lowerTitle = title.toLowerCase();
            const lowerSearch = search.toLowerCase();

            // Simple text matching for now (in production, use actual vector search)
            if (lowerTitle.includes(lowerSearch) || (data.plainText && data.plainText.toLowerCase().includes(lowerSearch))) {
              // Calculate a simple relevance score
              let score = 0.5;
              if (lowerTitle.includes(lowerSearch)) {
                score += 0.3;
                if (lowerTitle === lowerSearch) score += 0.2;
              }

              results.push({
                id: doc.id,
                score,
                documentTitle: title,
              });
            }
          }
        }

        // Sort by score and limit to top 20
        results.sort((a, b) => b.score - a.score);

        return NextResponse.json({ data: results.slice(0, 20) });
      }

      case "filters": {
        // Filter documents by tags, status, priority, due date
        const queryBuilder = collection(db, "documents");
        const filters: any[] = [];

        filters.push(where("userId", "==", userId));

        if (status && status !== "all") {
          filters.push(where("status", "==", status));
        }

        if (priority && priority !== "all") {
          filters.push(where("priority", "==", priority));
        }

        if (dueDate && dueDate !== "all") {
          const now = new Date();

          if (dueDate === "overdue") {
            filters.push(where("dueDate", "<", now));
          } else if (dueDate === "today") {
            const todayStart = new Date(now);
            todayStart.setHours(0, 0, 0, 0);
            const todayEnd = new Date(now);
            todayEnd.setHours(23, 59, 59, 999);
            filters.push(where("dueDate", ">=", todayStart));
            filters.push(where("dueDate", "<=", todayEnd));
          } else if (dueDate === "this-week") {
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            weekStart.setHours(0, 0, 0, 0);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);
            filters.push(where("dueDate", ">=", weekStart));
            filters.push(where("dueDate", "<=", weekEnd));
          } else if (dueDate === "next-week") {
            const nextWeekStart = new Date(now);
            nextWeekStart.setDate(now.getDate() + 7);
            nextWeekStart.setDate(nextWeekStart.getDate() - nextWeekStart.getDay());
            nextWeekStart.setHours(0, 0, 0, 0);
            const nextWeekEnd = new Date(nextWeekStart);
            nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
            nextWeekEnd.setHours(23, 59, 59, 999);
            filters.push(where("dueDate", ">=", nextWeekStart));
            filters.push(where("dueDate", "<=", nextWeekEnd));
          }
        }

        if (tags && tags.length > 0 && tags[0]) {
          const uniqueTags = [...new Set(tags)].filter(Boolean);
          if (uniqueTags.length > 0) {
            filters.push(where("tags", "array-contains-any", uniqueTags));
          }
        }

        const docsQuery = query(
          collection(db, "documents"),
          ...filters,
          orderBy("createdAt", "desc"),
          limit(50)
        );

        const docsSnapshot = await getDocs(docsQuery);
        const results = docsSnapshot.docs.map((d) => ({
          id: d.id,
          title: d.data()?.title || "",
          status: d.data()?.status,
          priority: d.data()?.priority,
          dueDate: d.data()?.dueDate?.toDate?.() || d.data()?.dueDate,
          tags: d.data()?.tags || [],
        }));

        return NextResponse.json({ data: results });
      }

      default: {
        // Basic text search
        if (!search) {
          return NextResponse.json({ error: "Bad Request", message: "Query de busca é obrigatória" });
        }

        const lowerSearch = search.toLowerCase();
        const docsQuery = query(
          collection(db, "documents"),
          where("userId", "==", userId),
          orderBy("createdAt", "desc"),
          limit(50)
        );

        const docsSnapshot = await getDocs(docsQuery);
        const results = docsSnapshot.docs
          .map((d) => {
            const data = d.data();
            const title = data.title || "";
            const plainText = data.plainText || "";

            let score = 0;
            const lowerTitle = title.toLowerCase();
            const lowerText = plainText.toLowerCase();

            if (lowerTitle.includes(lowerSearch)) {
              score += 1;
              if (lowerTitle === lowerSearch) score += 0.5;
            }
            if (lowerText.includes(lowerSearch)) {
              score += 0.5;
            }

            return {
              id: d.id,
              title,
              score,
            };
          })
          .filter((r) => r.score > 0)
          .sort((a, b) => b.score - a.score);

        return NextResponse.json({ data: results.slice(0, 20) });
      }
    }
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    );
  }
}
