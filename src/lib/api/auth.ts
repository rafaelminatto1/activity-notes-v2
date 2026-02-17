import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/firebase/api-keys";

export async function authenticateApi(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");
  
  if (!apiKey) {
    return { userId: null, error: NextResponse.json({ error: "API key missing" }, { status: 401 }) };
  }

  const userId = await validateApiKey(apiKey);
  
  if (!userId) {
    return { userId: null, error: NextResponse.json({ error: "Invalid API key" }, { status: 401 }) };
  }

  return { userId, error: null };
}
