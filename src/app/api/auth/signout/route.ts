import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/firebase/config";

export async function GET() {
  const response = NextResponse.redirect(
    new URL(
      "/login",
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    ),
  );
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  return response;
}
