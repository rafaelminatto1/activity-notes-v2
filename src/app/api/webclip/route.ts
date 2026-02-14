import { NextResponse } from "next/server";
import { getFirestore, collection, doc, getDoc, addDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

/**
 * Web Clipper API route handler
 */

interface WebClipMetadata {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
  siteName?: string;
  author?: string;
  publishedDate?: string;
}

/**
 * Fetch metadata from a URL
 */
async function fetchUrlMetadata(url: string): Promise<WebClipMetadata> {
  try {
    // Try to fetch the page HTML
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();

    // Parse HTML to extract metadata
    const metadata: WebClipMetadata = { url };

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      metadata.title = titleMatch[1].trim();
    }

    // Extract Open Graph metadata
    const ogTitle = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"[^>]*>/i);
    if (ogTitle) metadata.title = ogTitle[1];

    const ogDescription = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"[^>]*>/i);
    if (ogDescription) metadata.description = ogDescription[1];

    const ogImage = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"[^>]*>/i);
    if (ogImage) metadata.image = ogImage[1];

    const ogSiteName = html.match(/<meta[^>]*property="og:site_name"[^>]*content="([^"]*)"[^>]*>/i);
    if (ogSiteName) metadata.siteName = ogSiteName[1];

    // Extract Twitter Card metadata
    const twitterTitle = html.match(/<meta[^>]*name="twitter:title"[^>]*content="([^"]*)"[^>]*>/i);
    if (twitterTitle && !metadata.title) metadata.title = twitterTitle[1];

    const twitterImage = html.match(/<meta[^>]*name="twitter:image"[^>]*content="([^"]*)"[^>]*>/i);
    if (twitterImage && !metadata.image) metadata.image = twitterImage[1];

    // Extract description from meta tag
    if (!metadata.description) {
      const metaDescription = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i);
      if (metaDescription) metadata.description = metaDescription[1];
    }

    // Extract favicon
    const faviconMatch = html.match(/<link[^>]*rel="(?:shortcut )?icon"[^>]*href="([^"]*)"[^>]*>/i);
    if (faviconMatch) {
      let favicon = faviconMatch[1];
      if (favicon.startsWith("//")) {
        favicon = "https:" + favicon;
      } else if (favicon.startsWith("/")) {
        const urlObj = new URL(url);
        favicon = `${urlObj.protocol}//${urlObj.host}${favicon}`;
      }
      metadata.favicon = favicon;
    }

    // Extract author
    const authorMatch = html.match(/<meta[^>]*name="author"[^>]*content="([^"]*)"[^>]*>/i);
    if (authorMatch) metadata.author = authorMatch[1];

    // Extract published date (article)
    const articleDate = html.match(/<meta[^>]*property="article:published_time"[^>]*content="([^"]*)"[^>]*>/i);
    if (articleDate) metadata.publishedDate = articleDate[1];

    return metadata;
  } catch (error) {
    console.error("Error fetching URL metadata:", error);
    // Return minimal metadata on error
    return {
      url,
      title: url,
    };
  }
}

/**
 * GET - Fetch metadata for a URL
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "Bad Request", message: "url é obrigatório" },
      { status: 400 }
    );
  }

  try {
    const metadata = await fetchUrlMetadata(url);
    return NextResponse.json({ data: metadata });
  } catch (error) {
    console.error("Web clipper API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new web clip
 */
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
  const { url, documentId, summary } = body;

  if (!url) {
    return NextResponse.json(
      { error: "Bad Request", message: "url é obrigatório" },
      { status: 400 }
    );
  }

  const db = getFirestore();

  try {
    // Fetch metadata
    const metadata = await fetchUrlMetadata(url);

    // Create web clip document
    const docRef = await addDoc(collection(db, "web_clips"), {
      ...metadata,
      userId: user.uid,
      documentId: documentId || null,
      summary: summary || metadata.description || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // If documentId is provided, create a bookmark reference
    if (documentId) {
      const docRef2 = doc(db, "documents", documentId);
      const docSnap = await getDoc(docRef2);

      if (docSnap.exists()) {
        const currentContent = docSnap.data().content || { type: "doc", content: [] };
        currentContent.content.push({
          type: "bookmark",
          attrs: {
            url,
            title: metadata.title || url,
            description: metadata.description,
            image: metadata.image,
          },
        });

        await addDoc(collection(db, "bookmarks"), {
          webClipId: docRef.id,
          documentId,
          userId: user.uid,
          createdAt: new Date(),
        });
      }
    }

    const createdDoc = await getDoc(docRef);
    return NextResponse.json({
      data: { id: docRef.id, ...createdDoc.data() },
    });
  } catch (error) {
    console.error("Create web clip error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    );
  }
}
