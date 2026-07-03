"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireSessionUser } from "@/lib/firebase/auth-server";

export async function updateProfile(data: {
  full_name?: string;
  avatar_url?: string;
  onboarding_complete?: boolean;
}) {
  const user = await requireSessionUser();
  const db = getAdminDb();

  await db.collection("users").doc(user.uid).set(
    { ...data, updated_at: new Date() },
    { merge: true }
  );

  revalidatePath("/");
  revalidatePath("/settings");
  return { success: true };
}

export async function signOut() {
  redirect("/api/auth/signout");
}