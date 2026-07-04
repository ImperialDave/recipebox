import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/firebase/auth-server";
import { getBackupRecipes } from "@/lib/backup/get-backup-recipes";
import { buildRecipeZipStream } from "@/lib/backup/build-recipe-zip";
import { backupZipFilename } from "@/lib/backup/filenames";
import { checkBackupRateLimit, recordBackup } from "@/lib/backup/rate-limit";

const MAX_RECIPES = 500;

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const rateLimit = await checkBackupRateLimit(user.uid);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Please wait before creating another backup",
        retry_after_seconds: rateLimit.retryAfterSeconds,
      },
      { status: 429 },
    );
  }

  const { searchParams } = new URL(request.url);
  const ownedOnly = searchParams.get("owned_only") === "true";
  const includePhotos = searchParams.get("include_photos") !== "false";

  const recipes = await getBackupRecipes(user.uid, ownedOnly);

  if (recipes.length === 0) {
    return NextResponse.json(
      { error: "No recipes to export" },
      { status: 404 },
    );
  }

  if (recipes.length > MAX_RECIPES) {
    return NextResponse.json(
      {
        error: `Too many recipes (${recipes.length}). Maximum is ${MAX_RECIPES}.`,
      },
      { status: 413 },
    );
  }

  await recordBackup(user.uid);

  const stream = buildRecipeZipStream(recipes, { includePhotos });
  const filename = backupZipFilename();

  return new Response(stream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
