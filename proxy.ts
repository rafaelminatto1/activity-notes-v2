import { NextRequest, NextResponse } from "next/server";

const AUTH_PAGES = ["/login", "/register"];
const PROTECTED_PREFIXES = ["/documents", "/settings", "/trash"];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authToken = request.cookies.get("__session")?.value;

  const isAuthPage = AUTH_PAGES.includes(pathname);
  const isProtectedPage = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isProtectedPage && !authToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthPage && authToken) {
    return NextResponse.redirect(new URL("/documents", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
