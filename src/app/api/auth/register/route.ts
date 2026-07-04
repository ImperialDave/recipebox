import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { ensureUserProfile } from "@/lib/firebase/auth-server";

export async function POST(request: Request) {
  try {
    const { idToken, fullName } = await request.json();
    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    const decoded = await getAdminAuth().verifyIdToken(idToken);
    await ensureUserProfile(decoded.uid, decoded.email || "", fullName);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Registration failed" },
      { status: 400 },
    );
  }
}
