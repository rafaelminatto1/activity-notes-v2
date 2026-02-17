import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth/server-utils";
import { createWebClipDocument } from "@/lib/firebase/firestore";
import { generateJSON } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      title, 
      html, 
      plainText, 
      sourceUrl, 
      coverImage, 
      projectId, 
      tags,
      type // 'article' | 'full' | 'bookmark' | 'screenshot'
    } = body;

    if (!title || (!html && !plainText && type !== 'screenshot')) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Convert HTML to TipTap JSON if provided
    let content = null;
    if (html) {
      content = generateJSON(html, [
        StarterKit,
        Image,
        Link,
      ]);
    } else if (type === 'screenshot' && coverImage) {
      // For screenshot, create a document with the image
      content = {
        type: 'doc',
        content: [
          {
            type: 'image',
            attrs: { src: coverImage }
          }
        ]
      };
    } else if (plainText) {
      content = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: plainText }]
          }
        ]
      };
    }

    const docId = await createWebClipDocument(userId, {
      title,
      content,
      plainText: plainText || title,
      sourceUrl,
      coverImage,
      projectId,
      tags,
    });

    return NextResponse.json({ success: true, docId });
  } catch (error) {
    console.error("WebClip API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
