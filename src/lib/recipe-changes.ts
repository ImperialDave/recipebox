import type { Ingredient, Instruction, RecipeEditChange } from "@/lib/types";

const TRUNCATE = 120;

type IngredientInput = Pick<
  Ingredient,
  "quantity" | "unit" | "name" | "prep_note"
>;
type InstructionInput = Pick<Instruction, "text" | "timer_minutes">;

export interface RecipeSnapshot {
  title: string;
  description: string | null;
  hero_url: string | null;
  gallery_urls: string[];
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  total_time_minutes: number | null;
  servings: number | null;
  difficulty: string | null;
  category: string;
  tags: string[];
  status: string;
  is_private: boolean;
  group_ids: string[];
  ingredients: IngredientInput[];
  instructions: InstructionInput[];
}

function truncate(value: string): string {
  if (value.length <= TRUNCATE) return value;
  return `${value.slice(0, TRUNCATE)}…`;
}

function scalarChange(
  field: string,
  label: string,
  before: string | number | null | undefined,
  after: string | number | null | undefined,
): RecipeEditChange | null {
  const b = before ?? "";
  const a = after ?? "";
  if (String(b) === String(a)) return null;
  return {
    field,
    label,
    before: truncate(String(b)),
    after: truncate(String(a)),
  };
}

function ingredientLabel(ing: IngredientInput): string {
  const parts = [ing.quantity, ing.unit, ing.name].filter(Boolean);
  const base = parts.join(" ");
  return ing.prep_note ? `${base}, ${ing.prep_note}` : base;
}

function instructionLabel(inst: InstructionInput): string {
  const timer =
    inst.timer_minutes != null ? ` (${inst.timer_minutes} min)` : "";
  return `${inst.text}${timer}`;
}

function countMap(items: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const item of items) {
    map.set(item, (map.get(item) ?? 0) + 1);
  }
  return map;
}

function diffLines(
  field: string,
  label: string,
  before: string[],
  after: string[],
): RecipeEditChange | null {
  const beforeMap = countMap(before);
  const afterMap = countMap(after);

  const details: string[] = [];

  for (const [line, count] of beforeMap) {
    const nextCount = afterMap.get(line) ?? 0;
    const removed = count - nextCount;
    for (let i = 0; i < removed; i++) {
      details.push(`Removed: ${line}`);
    }
  }

  for (const [line, count] of afterMap) {
    const prevCount = beforeMap.get(line) ?? 0;
    const added = count - prevCount;
    for (let i = 0; i < added; i++) {
      details.push(`Added: ${line}`);
    }
  }

  if (details.length === 0) return null;

  return {
    field,
    label,
    before: `${before.length} item${before.length === 1 ? "" : "s"}`,
    after: `${after.length} item${after.length === 1 ? "" : "s"}`,
    details,
  };
}

export function buildEditSummary(changes: RecipeEditChange[]): string {
  if (changes.length === 0) return "Updated recipe";
  if (changes.length === 1) return `Updated ${changes[0].label.toLowerCase()}`;
  if (changes.length === 2) {
    return `Updated ${changes[0].label.toLowerCase()} and ${changes[1].label.toLowerCase()}`;
  }
  const labels = changes.map((c) => c.label.toLowerCase());
  const last = labels.pop();
  return `Updated ${labels.join(", ")}, and ${last}`;
}

export function computeRecipeChanges(
  before: RecipeSnapshot,
  after: RecipeSnapshot,
): RecipeEditChange[] {
  const changes: RecipeEditChange[] = [];

  const scalarFields: {
    field: keyof RecipeSnapshot;
    label: string;
  }[] = [
    { field: "title", label: "Title" },
    { field: "description", label: "Family story" },
    { field: "category", label: "Category" },
    { field: "difficulty", label: "Difficulty" },
    { field: "status", label: "Status" },
    { field: "prep_time_minutes", label: "Prep time" },
    { field: "cook_time_minutes", label: "Cook time" },
    { field: "total_time_minutes", label: "Total time" },
    { field: "servings", label: "Servings" },
  ];

  for (const { field, label } of scalarFields) {
    const change = scalarChange(
      field,
      label,
      before[field] as string | number | null,
      after[field] as string | number | null,
    );
    if (change) changes.push(change);
  }

  if (before.is_private !== after.is_private) {
    changes.push({
      field: "is_private",
      label: "Visibility",
      before: before.is_private ? "Private" : "Shared",
      after: after.is_private ? "Private" : "Shared",
    });
  }

  const beforeTags = [...before.tags].sort().join(", ");
  const afterTags = [...after.tags].sort().join(", ");
  if (beforeTags !== afterTags) {
    changes.push({
      field: "tags",
      label: "Tags",
      before: beforeTags || "None",
      after: afterTags || "None",
    });
  }

  const beforeGroups = [...before.group_ids].sort().join(", ");
  const afterGroups = [...after.group_ids].sort().join(", ");
  if (beforeGroups !== afterGroups) {
    changes.push({
      field: "group_ids",
      label: "Shared groups",
      before: beforeGroups || "None",
      after: afterGroups || "None",
    });
  }

  if ((before.hero_url || "") !== (after.hero_url || "")) {
    changes.push({
      field: "hero_url",
      label: "Photo",
      before: before.hero_url ? "Previous photo" : "No photo",
      after: after.hero_url ? "Updated photo" : "Removed photo",
    });
  }

  if (
    JSON.stringify(before.gallery_urls || []) !==
    JSON.stringify(after.gallery_urls || [])
  ) {
    changes.push({
      field: "gallery_urls",
      label: "Gallery",
      before: `${before.gallery_urls.length} image${before.gallery_urls.length === 1 ? "" : "s"}`,
      after: `${after.gallery_urls.length} image${after.gallery_urls.length === 1 ? "" : "s"}`,
    });
  }

  const ingredientChange = diffLines(
    "ingredients",
    "Ingredients",
    before.ingredients.map(ingredientLabel),
    after.ingredients.map(ingredientLabel),
  );
  if (ingredientChange) changes.push(ingredientChange);

  const instructionChange = diffLines(
    "instructions",
    "Instructions",
    before.instructions.map(instructionLabel),
    after.instructions.map(instructionLabel),
  );
  if (instructionChange) changes.push(instructionChange);

  return changes;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asNullableNumber(value: unknown): number | null {
  return typeof value === "number" ? value : null;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function toRecipeSnapshot(
  data: Record<string, unknown> | RecipeSnapshot,
): RecipeSnapshot {
  const ingredients = Array.isArray(data.ingredients) ? data.ingredients : [];
  const instructions = Array.isArray(data.instructions) ? data.instructions : [];

  return {
    title: asString(data.title),
    description: asNullableString(data.description),
    hero_url: asNullableString(data.hero_url),
    gallery_urls: asStringArray(data.gallery_urls),
    prep_time_minutes: asNullableNumber(data.prep_time_minutes),
    cook_time_minutes: asNullableNumber(data.cook_time_minutes),
    total_time_minutes: asNullableNumber(data.total_time_minutes),
    servings: asNullableNumber(data.servings),
    difficulty: asNullableString(data.difficulty),
    category: asString(data.category, "Dinner"),
    tags: asStringArray(data.tags),
    status: asString(data.status, "draft"),
    is_private:
      typeof data.is_private === "boolean" ? data.is_private : true,
    group_ids: asStringArray(data.group_ids),
    ingredients: ingredients.map((ing) => {
      const item = ing as Record<string, unknown>;
      return {
        quantity: asString(item.quantity),
        unit: asString(item.unit),
        name: asString(item.name),
        prep_note: asString(item.prep_note),
      };
    }),
    instructions: instructions.map((inst) => {
      const item = inst as Record<string, unknown>;
      return {
        text: asString(item.text),
        timer_minutes: asNullableNumber(item.timer_minutes),
      };
    }),
  };
}

export function formDataToSnapshot(data: {
  title: string;
  description: string;
  hero_url: string | null;
  gallery_urls: string[];
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  total_time_minutes: number | null;
  servings: number | null;
  difficulty: string | null;
  category: string;
  tags: string[];
  status: string;
  is_private: boolean;
  group_ids: string[];
  ingredients: IngredientInput[];
  instructions: InstructionInput[];
}): RecipeSnapshot {
  return toRecipeSnapshot({
    ...data,
    description: data.description || null,
  });
}