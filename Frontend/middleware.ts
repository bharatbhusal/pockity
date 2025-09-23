import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/auth/signIn") ||
    pathname.startsWith("/auth/signUp") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith("manifest.json")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("authToken")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/auth/signIn", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
