import { DEFAULT_CATEGORIES, DIFFICULTY_LEVELS } from "@/lib/constants";
import { getGeminiApiKey, getGeminiModel } from "./gemini-config";
import { normalizeParsedRecipe } from "./normalize-parsed-recipe";
import type { ParsedRecipeDraft } from "./types";

const SYSTEM_PROMPT = `You extract recipe data from a photo of a recipe card, cookbook page, or screenshot.

Return ONLY valid JSON matching this shape:
{
  "title": string | null,
  "description": string | null,
  "prep_time_minutes": number | null,
  "cook_time_minutes": number | null,
  "servings": number | null,
  "difficulty": "Easy" | "Medium" | "Hard" | null,
  "category": string | null,
  "tags": string[],
  "ingredients": [
    { "quantity": string, "unit": string, "name": string, "prep_note": string }
  ],
  "instructions": [
    { "text": string, "timer_minutes": number | null }
  ],
  "warnings": string[],
  "field_confidence": {
    "title": "high" | "medium" | "low",
    "ingredients": "high" | "medium" | "low",
    "instructions": "high" | "medium" | "low"
  }
}

Rules:
- Split ingredient lines into quantity, unit, name, and prep_note when possible.
- Use empty strings for missing ingredient quantity/unit/prep_note.
- Each instruction should be one cooking step.
- Parse times like "1 hour 15 minutes" into minutes.
- Put headnotes or story text in description, not instructions.
- category should be one of: ${DEFAULT_CATEGORIES.join("; ")}
- difficulty should be one of: ${DIFFICULTY_LEVELS.join(", ")} or null.
- Add warnings for illegible, missing, or uncertain sections.
- If the image is not a recipe, return null title, empty arrays, and a warning explaining why.`;

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
    finishReason?: string;
  }>;
  error?: { message?: string; status?: string; code?: number };
}

function extractGeminiError(payload: GeminiResponse, status: number): string {
  if (payload.error?.message) {
    return payload.error.message;
  }
  const reason = payload.candidates?.[0]?.finishReason;
  if (reason && reason !== "STOP") {
    return `Gemini could not complete the scan (${reason})`;
  }
  return `Could not parse recipe from photo (HTTP ${status})`;
}

export async function parseRecipeImage(
  buffer: Buffer,
  mimeType: string,
): Promise<ParsedRecipeDraft> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error(
      "Recipe scanning is not configured. Set GEMINI_API_KEY in Railway.",
    );
  }

  const model = getGeminiModel();
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: SYSTEM_PROMPT },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: buffer.toString("base64"),
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    },
  );

  const payload = (await response.json()) as GeminiResponse;

  if (!response.ok) {
    throw new Error(extractGeminiError(payload, response.status));
  }

  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("No recipe data returned from scan");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Could not read structured recipe data from photo");
  }

  return normalizeParsedRecipe(parsed);
}