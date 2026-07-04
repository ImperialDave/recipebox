const IMAGE_TIMEOUT_MS = 5000;

export async function fetchImageBuffer(
  url: string,
): Promise<{ buffer: Buffer; ext: string } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), IMAGE_TIMEOUT_MS);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") || "";
    const ext =
      extensionFromContentType(contentType) || extensionFromUrl(url) || "jpg";
    const buffer = Buffer.from(await res.arrayBuffer());

    if (buffer.length === 0 || buffer.length > 10 * 1024 * 1024) return null;

    return { buffer, ext };
  } catch {
    return null;
  }
}

function extensionFromContentType(contentType: string): string | null {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  const base = contentType.split(";")[0].trim().toLowerCase();
  return map[base] ?? null;
}

function extensionFromUrl(url: string): string | null {
  const match = url.match(/\.(jpe?g|png|webp|gif)(?:\?|$)/i);
  if (!match) return null;
  const ext = match[1].toLowerCase();
  return ext === "jpeg" ? "jpg" : ext;
}
