import { cookies } from "next/headers";
import { getAdminAuth } from "./admin";
import { SESSION_COOKIE_NAME } from "./config";
import type { Profile } from "@/lib/types";
import { getAdminDb } from "./admin";

export async function getSessionUser() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!session) return null;

  try {
    const decoded = await getAdminAuth().verifySessionCookie(session, true);
    return decoded;
  } catch {
    return null;
  }
}

export async function requireSessionUser() {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");
  return user;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const user = await getSessionUser();
  if (!user) return null;

  const doc = await getAdminDb().collection("users").doc(user.uid).get();
  if (!doc.exists) {
    return {
      id: user.uid,
      email: user.email || "",
      full_name: user.name || null,
      avatar_url: null,
      onboarding_complete: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  const data = doc.data()!;
  return {
    id: user.uid,
    email: data.email || user.email || "",
    full_name: data.full_name || null,
    avatar_url: data.avatar_url || null,
    onboarding_complete: data.onboarding_complete ?? false,
    created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
    updated_at: data.updated_at?.toDate?.()?.toISOString() || new Date().toISOString(),
  };
}

export async function ensureUserProfile(uid: string, email: string, fullName?: string) {
  const db = getAdminDb();
  const ref = db.collection("users").doc(uid);
  const doc = await ref.get();

  if (!doc.exists) {
    const now = new Date();
    await ref.set({
      email,
      full_name: fullName || null,
      avatar_url: null,
      onboarding_complete: false,
      created_at: now,
      updated_at: now,
    });
  }
}