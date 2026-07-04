import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "./config";

const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/auth/callback",
  "/join",
  "/onboarding",
];

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const session = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const isAuthenticated = !!session;

  if (!isAuthenticated && !isPublic && pathname !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (isAuthenticated && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
