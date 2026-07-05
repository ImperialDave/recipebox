import {
  DEFAULT_CATEGORIES,
  DIFFICULTY_LEVELS,
  SUGGESTED_TAGS,
  UNITS,
} from "@/lib/constants";
import type { ParsedRecipeDraft, ParsedInstruction } from "./types";

const UNIT_ALIASES: Record<string, string> = {
  tablespoon: "tbsp",
  tablespoons: "tbsp",
  tbsp: "tbsp",
  teaspoon: "tsp",
  teaspoons: "tsp",
  tsp: "tsp",
  ounce: "oz",
  ounces: "oz",
  oz: "oz",
  pound: "lb",
  pounds: "lb",
  lb: "lb",
  lbs: "lb",
  gram: "g",
  grams: "g",
  g: "g",
  kilogram: "kg",
  kilograms: "kg",
  kg: "kg",
  milliliter: "ml",
  milliliters: "ml",
  ml: "ml",
  liter: "L",
  liters: "L",
  l: "L",
  cup: "cup",
  cups: "cups",
  pinch: "pinch",
  dash: "dash",
  clove: "clove",
  cloves: "clove",
  slice: "slice",
  slices: "slice",
  piece: "piece",
  pieces: "piece",
  can: "can",
  cans: "can",
  package: "package",
  packages: "package",
  bunch: "bunch",
  bunches: "bunch",
  head: "head",
  heads: "head",
  stick: "stick",
  sticks: "stick",
};

const ALLOWED_UNITS = new Set<string>(UNITS.filter(Boolean));

function normalizeUnit(unit: string): string {
  const trimmed = unit.trim();
  if (!trimmed) return "";
  const alias = UNIT_ALIASES[trimmed.toLowerCase()];
  if (alias && ALLOWED_UNITS.has(alias)) return alias;
  const lower = trimmed.toLowerCase();
  if (ALLOWED_UNITS.has(lower)) return lower;
  return trimmed;
}

const CATEGORY_KEYWORDS: Partial<Record<(typeof DEFAULT_CATEGORIES)[number], string[]>> = {
  "Preserves & Canning": [
    "preserve",
    "canning",
    "pickle",
    "pickling",
    "ferment",
    "jam",
    "jelly",
    "marmalade",
  ],
  Remedies: [
    "remedy",
    "remedies",
    "wellness",
    "herbal",
    "salve",
    "tincture",
    "cough",
    "cold",
    "immune",
  ],
  "Household Cleaners": [
    "cleaner",
    "cleaners",
    "cleaning",
    "disinfect",
    "laundry",
    "detergent",
    "degreaser",
  ],
  "Personal Care": [
    "personal care",
    "soap",
    "lotion",
    "shampoo",
    "beauty",
    "balm",
    "scrub",
    "deodorant",
    "toothpaste",
  ],
  "Garden & Outdoor": [
    "garden",
    "outdoor",
    "compost",
    "fertilizer",
    "pest",
    "plant",
    "lawn",
  ],
  "Crafts & Activities": [
    "craft",
    "crafts",
    "diy",
    "playdough",
    "slime",
    "candle",
    "activity",
    "activities",
  ],
};

function matchCategoryByKeywords(normalized: string): string | null {
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      return category;
    }
  }
  return null;
}

function matchCategory(category: string | null): string {
  if (!category?.trim()) return "Dinner";
  const normalized = category.trim().toLowerCase();
  const exact = DEFAULT_CATEGORIES.find(
    (item) => item.toLowerCase() === normalized,
  );
  if (exact) return exact;

  const fuzzy = DEFAULT_CATEGORIES.find(
    (item) =>
      item.toLowerCase().includes(normalized) ||
      normalized.includes(item.toLowerCase()),
  );
  if (fuzzy) return fuzzy;

  return matchCategoryByKeywords(normalized) || "Dinner";
}

function matchDifficulty(difficulty: string | null): string | null {
  if (!difficulty?.trim()) return null;
  const normalized = difficulty.trim().toLowerCase();
  return (
    DIFFICULTY_LEVELS.find((level) => level.toLowerCase() === normalized) ||
    null
  );
}

function normalizeTags(tags: string[]): string[] {
  const allowed = new Set<string>(SUGGESTED_TAGS);
  return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))].filter(
    (tag) => allowed.has(tag as (typeof SUGGESTED_TAGS)[number]) || tag.length <= 30,
  );
}

function extractTimerMinutes(text: string): number | null {
  const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|hr)\b/i);
  const minuteMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:minutes?|mins?|min)\b/i);

  const hours = hourMatch ? Number(hourMatch[1]) : 0;
  const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;
  const total = Math.round(hours * 60 + minutes);

  return total > 0 ? total : null;
}

function normalizeInstructions(
  instructions: ParsedInstruction[],
): ParsedInstruction[] {
  return instructions
    .map((instruction) => {
      const text = instruction.text?.trim() || "";
      if (!text) return null;
      const timer =
        instruction.timer_minutes ?? extractTimerMinutes(text) ?? null;
      return { text, timer_minutes: timer };
    })
    .filter((instruction): instruction is ParsedInstruction => instruction !== null);
}

function asNullableNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.round(value));
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : null;
  }
  return null;
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function asConfidence(
  value: unknown,
): "high" | "medium" | "low" | undefined {
  if (value === "high" || value === "medium" || value === "low") return value;
  return undefined;
}

export function normalizeParsedRecipe(raw: unknown): ParsedRecipeDraft {
  const data =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const ingredients = Array.isArray(data.ingredients)
    ? data.ingredients
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const ing = item as Record<string, unknown>;
          const name = asNullableString(ing.name);
          if (!name) return null;
          return {
            quantity: asNullableString(ing.quantity) || "",
            unit: normalizeUnit(asNullableString(ing.unit) || ""),
            name,
            prep_note: asNullableString(ing.prep_note) || "",
          };
        })
        .filter((item): item is ParsedRecipeDraft["ingredients"][number] => item !== null)
    : [];

  const instructions = normalizeInstructions(
    Array.isArray(data.instructions)
      ? data.instructions
          .map((item) => {
            if (!item || typeof item !== "object") return null;
            const inst = item as Record<string, unknown>;
            return {
              text: asNullableString(inst.text) || "",
              timer_minutes: asNullableNumber(inst.timer_minutes),
            };
          })
          .filter((item): item is ParsedInstruction => item !== null)
      : [],
  );

  const warnings = asStringArray(data.warnings);
  if (!ingredients.length) {
    warnings.push("No ingredients were detected — please review carefully.");
  }
  if (!instructions.length) {
    warnings.push("No instructions were detected — please review carefully.");
  }

  const fieldConfidenceRaw =
    data.field_confidence && typeof data.field_confidence === "object"
      ? (data.field_confidence as Record<string, unknown>)
      : {};

  const fieldConfidence: ParsedRecipeDraft["fieldConfidence"] = {};
  for (const [key, value] of Object.entries(fieldConfidenceRaw)) {
    const confidence = asConfidence(value);
    if (confidence) fieldConfidence[key] = confidence;
  }

  const prep = asNullableNumber(data.prep_time_minutes);
  const cook = asNullableNumber(data.cook_time_minutes);

  return {
    title: asNullableString(data.title),
    description: asNullableString(data.description),
    prep_time_minutes: prep,
    cook_time_minutes: cook,
    servings: asNullableNumber(data.servings),
    difficulty: matchDifficulty(asNullableString(data.difficulty)),
    category: matchCategory(asNullableString(data.category)),
    tags: normalizeTags(asStringArray(data.tags)),
    ingredients,
    instructions,
    warnings: [...new Set(warnings)],
    fieldConfidence,
  };
}