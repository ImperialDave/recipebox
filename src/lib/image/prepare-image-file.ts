const HEIC_TYPES = new Set([
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
]);

function isHeicFile(file: File): boolean {
  const extension = file.name.split(".").pop()?.toLowerCase();
  return (
    HEIC_TYPES.has(file.type) ||
    extension === "heic" ||
    extension === "heif"
  );
}

export function isSupportedImageFile(file: File): boolean {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const supportedExtensions = new Set(["jpg", "jpeg", "png", "webp", "heic", "heif"]);
  const supportedTypes = new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    ...HEIC_TYPES,
    "",
    "application/octet-stream",
  ]);

  return (
    supportedExtensions.has(extension || "") ||
    supportedTypes.has(file.type) ||
    isHeicFile(file)
  );
}

export async function prepareImageFile(file: File): Promise<File> {
  if (!isHeicFile(file)) {
    return file;
  }

  const { default: heic2any } = await import("heic2any");
  const converted = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.9,
  });

  const blob = Array.isArray(converted) ? converted[0] : converted;
  const baseName = file.name.replace(/\.(heic|heif)$/i, "") || "photo";
  return new File([blob], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: file.lastModified,
  });
}

export async function prepareImageFileForUpload(file: File): Promise<File> {
  const prepared = await prepareImageFile(file);
  if (prepared.type && prepared.type !== "application/octet-stream") {
    return prepared;
  }

  const extension = prepared.name.split(".").pop()?.toLowerCase();
  const mimeType =
    extension === "png"
      ? "image/png"
      : extension === "webp"
        ? "image/webp"
        : "image/jpeg";

  return new File([prepared], prepared.name, {
    type: mimeType,
    lastModified: prepared.lastModified,
  });
}