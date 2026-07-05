const EXTENSION_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export function inferImageMimeType(file: File): string | null {
  if (file.type && file.type !== "application/octet-stream") {
    return file.type;
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension) return null;
  return EXTENSION_MIME[extension] ?? null;
}

export function isAllowedImageMimeType(mimeType: string | null): boolean {
  if (!mimeType) return false;
  return ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(
    mimeType,
  );
}