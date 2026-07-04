import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/firebase/auth-server";
import { parseRecipeImage } from "@/lib/recipe-scan/parse-recipe-image";
import {
  checkRecipeScanRateLimit,
  recordRecipeScan,
} from "@/lib/recipe-scan/rate-limit";

const MAX_IMAGE_BYTES =
  (Number(process.env.RECIPE_SCAN_MAX_IMAGE_MB) || 10) * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const rateLimit = await checkRecipeScanRateLimit(user.uid);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Daily scan limit reached. Try again tomorrow.",
        remaining: 0,
        limit: rateLimit.limit,
        resets_at: rateLimit.resetsAt,
      },
      { status: 429 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("image");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Image file is required" }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Please upload a JPG, PNG, or WebP image" },
      { status: 400 },
    );
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: "Image is too large. Please use a photo under 10 MB." },
      { status: 400 },
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await parseRecipeImage(buffer, file.type);
    await recordRecipeScan(user.uid);

    const updatedLimit = await checkRecipeScanRateLimit(user.uid);

    const hasContent =
      Boolean(parsed.title) ||
      parsed.ingredients.length > 0 ||
      parsed.instructions.length > 0;

    if (!hasContent) {
      return NextResponse.json(
        {
          error:
            "We couldn't read a recipe in this photo. Try brighter light, a flatter angle, or a clearer image.",
          parsed,
          remaining: updatedLimit.remaining,
          limit: updatedLimit.limit,
        },
        { status: 422 },
      );
    }

    return NextResponse.json({
      parsed,
      remaining: updatedLimit.remaining,
      limit: updatedLimit.limit,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not parse recipe from photo",
      },
      { status: 500 },
    );
  }
}