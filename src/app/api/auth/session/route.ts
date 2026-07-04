import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { SESSION_COOKIE_NAME, SESSION_EXPIRY_MS } from "@/lib/firebase/config";

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();
    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    const sessionCookie = await getAdminAuth().createSessionCookie(idToken, {
      expiresIn: SESSION_EXPIRY_MS,
    });

    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      maxAge: SESSION_EXPIRY_MS / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Session creation failed",
      },
      { status: 401 },
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  return response;
}
