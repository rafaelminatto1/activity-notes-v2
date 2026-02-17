import { NextRequest } from "next/server";

export function decodeFirebaseToken(token: string): { uid: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf-8")
    );

    // Validate basic claims
    const now = Math.floor(Date.now() / 1000);
    if (!payload.user_id || !payload.exp) return null;
    if (payload.exp < now) return null;
    if (payload.iss && !payload.iss.startsWith("https://securetoken.google.com/")) return null;

    return { uid: payload.user_id };
  } catch {
    return null;
  }
}

export function getUserIdFromRequest(request: NextRequest): string | null {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;

  const token = auth.slice(7);
  const decoded = decodeFirebaseToken(token);
  return decoded?.uid ?? null;
}
