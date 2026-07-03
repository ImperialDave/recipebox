import type { Timestamp } from "firebase-admin/firestore";
import type { Recipe, Ingredient, Instruction } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

export function toISOString(value: Timestamp | Date | string | undefined): string {
  if (!value) return new Date().toISOString();
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  return value.toDate().toISOString();
}

export function mapRecipeDoc(id: string, data: FirebaseFirestore.DocumentData): Recipe {
  const ingredients: Ingredient[] = (data.ingredients || []).map(
    (ing: Omit<Ingredient, "id"> & { id?: string }, i: number) => ({
      id: ing.id || `ing-${i}`,
      quantity: ing.quantity || "",
      unit: ing.unit || "",
      name: ing.name || "",
      prep_note: ing.prep_note || "",
      sort_order: ing.sort_order ?? i,
    })
  );

  const instructions: Instruction[] = (data.instructions || []).map(
    (inst: Omit<Instruction, "id"> & { id?: string }, i: number) => ({
      id: inst.id || `step-${i}`,
      text: inst.text || "",
      timer_minutes: inst.timer_minutes ?? null,
      sort_order: inst.sort_order ?? i,
    })
  );

  return {
    id,
    title: data.title,
    description: data.description || null,
    hero_url: data.hero_url || null,
    gallery_urls: data.gallery_urls || [],
    prep_time_minutes: data.prep_time_minutes ?? null,
    cook_time_minutes: data.cook_time_minutes ?? null,
    total_time_minutes: data.total_time_minutes ?? null,
    servings: data.servings ?? null,
    difficulty: data.difficulty || null,
    category: data.category || "Dinner",
    tags: data.tags || [],
    status: data.status || "draft",
    is_private: data.is_private ?? true,
    owner_id: data.owner_id,
    created_at: toISOString(data.created_at),
    updated_at: toISOString(data.updated_at),
    ingredients: ingredients.sort((a, b) => a.sort_order - b.sort_order),
    instructions: instructions.sort((a, b) => a.sort_order - b.sort_order),
    group_ids: data.group_ids || [],
    owner: data.owner_name
      ? { id: data.owner_id, full_name: data.owner_name, avatar_url: data.owner_avatar || null, email: "", onboarding_complete: true, created_at: "", updated_at: "" }
      : undefined,
  };
}

export function prepareIngredients(
  ingredients: { quantity: string; unit: string; name: string; prep_note: string; sort_order: number }[]
) {
  return ingredients.map((ing, i) => ({
    id: uuidv4(),
    quantity: ing.quantity,
    unit: ing.unit,
    name: ing.name,
    prep_note: ing.prep_note,
    sort_order: i,
  }));
}

export function prepareInstructions(
  instructions: { text: string; timer_minutes: number | null; sort_order: number }[]
) {
  return instructions.map((inst, i) => ({
    id: uuidv4(),
    text: inst.text,
    timer_minutes: inst.timer_minutes,
    sort_order: i,
  }));
}

export function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}