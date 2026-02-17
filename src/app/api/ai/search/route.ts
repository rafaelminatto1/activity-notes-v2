import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/gemini/client";
import { AI_PROMPTS } from "@/lib/ai/prompts";
import { vectorSearch } from "@/lib/firebase/vector-search";
import { getUserIdFromRequest } from "@/lib/auth/server-utils";

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // 1. Semantic Search
    const searchResults = await vectorSearch({
      userId,
      query,
      limit: 5,
      minSimilarity: 0.5
    });

    if (searchResults.length === 0) {
      return NextResponse.json({ 
        answer: "Não encontrei informações relevantes nos seus documentos para responder a essa pergunta.",
        sources: [] 
      });
    }

    // 2. Prepare Context
    const context = searchResults
      .map(doc => `[Documento: ${doc.title}]\n${doc.content}`)
      .join("\n\n---\n\n");

    // 3. Generate Answer
    const prompt = `${AI_PROMPTS.SEARCH}\n\nContexto:\n${context}\n\nPergunta: ${query}`;
    
    const { text: answer } = await generateText(prompt);

    return NextResponse.json({
      answer,
      sources: searchResults.map(r => ({ id: r.documentId, title: r.title, similarity: r.similarity }))
    });

  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
