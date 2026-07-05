const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

export function getGeminiApiKey(): string | undefined {
  return (
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GEMINI_SCAN_API_KEY?.trim() ||
    process.env.GeminiScan?.trim()
  );
}

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
}

export function isRecipeScanConfigured(): boolean {
  return Boolean(getGeminiApiKey());
}