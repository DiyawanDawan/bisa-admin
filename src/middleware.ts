import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAdminAccessToken } from "@/lib/jwt-payload";

const TOKEN_COOKIE = "bisa_access_token";

const PUBLIC_PATHS = ["/signin", "/signup", "/error-404", "/verify", "/track"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(TOKEN_COOKIE)?.value;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    if (token && pathname.startsWith("/signin")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!token || !isAdminAccessToken(token)) {
    const signInUrl = new URL("/signin", request.url);
    signInUrl.searchParams.set("redirect", pathname);
    const response = NextResponse.redirect(signInUrl);
    if (token && !isAdminAccessToken(token)) {
      response.cookies.delete(TOKEN_COOKIE);
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
