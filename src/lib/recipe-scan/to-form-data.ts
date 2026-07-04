import type { RecipeFormData } from "@/lib/types";
import type { ParsedRecipeDraft } from "./types";

export function parsedRecipeToFormData(
  parsed: ParsedRecipeDraft,
  heroUrl?: string | null,
): Partial<RecipeFormData> {
  const prep = parsed.prep_time_minutes;
  const cook = parsed.cook_time_minutes;
  const total =
    prep != null || cook != null ? (prep || 0) + (cook || 0) || null : null;

  return {
    title: parsed.title || "",
    description: parsed.description || "",
    hero_url: heroUrl ?? null,
    prep_time_minutes: prep,
    cook_time_minutes: cook,
    total_time_minutes: total,
    servings: parsed.servings,
    difficulty: parsed.difficulty,
    category: parsed.category || "Dinner",
    tags: parsed.tags,
    ingredients:
      parsed.ingredients.length > 0
        ? parsed.ingredients.map((ingredient, index) => ({
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            name: ingredient.name,
            prep_note: ingredient.prep_note,
            sort_order: index,
          }))
        : undefined,
    instructions:
      parsed.instructions.length > 0
        ? parsed.instructions.map((instruction, index) => ({
            text: instruction.text,
            timer_minutes: instruction.timer_minutes,
            sort_order: index,
          }))
        : undefined,
  };
}

export function mergeFormData(
  current: RecipeFormData,
  patch: Partial<RecipeFormData>,
): RecipeFormData {
  return {
    ...current,
    ...patch,
    gallery_urls: patch.gallery_urls ?? current.gallery_urls,
    tags: patch.tags ?? current.tags,
    group_ids: patch.group_ids ?? current.group_ids,
    ingredients: patch.ingredients ?? current.ingredients,
    instructions: patch.instructions ?? current.instructions,
  };
}