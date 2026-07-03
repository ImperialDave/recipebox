import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/firebase/auth-server";
import { getBackupRecipes } from "@/lib/backup/get-backup-recipes";
import { checkBackupRateLimit } from "@/lib/backup/rate-limit";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const ownedOnly = searchParams.get("owned_only") === "true";

  const recipes = await getBackupRecipes(user.uid, ownedOnly);
  const rateLimit = await checkBackupRateLimit(user.uid);

  return NextResponse.json({
    count: recipes.length,
    can_backup: recipes.length > 0 && rateLimit.allowed,
    retry_after_seconds: rateLimit.retryAfterSeconds ?? null,
  });
}