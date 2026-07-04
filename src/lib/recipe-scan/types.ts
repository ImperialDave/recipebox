export type FieldConfidence = "high" | "medium" | "low";

export interface ParsedIngredient {
  quantity: string;
  unit: string;
  name: string;
  prep_note: string;
}

export interface ParsedInstruction {
  text: string;
  timer_minutes: number | null;
}

export interface ParsedRecipeDraft {
  title: string | null;
  description: string | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  servings: number | null;
  difficulty: string | null;
  category: string | null;
  tags: string[];
  ingredients: ParsedIngredient[];
  instructions: ParsedInstruction[];
  warnings: string[];
  fieldConfidence: Record<string, FieldConfidence>;
}

export const EMPTY_PARSED_RECIPE: ParsedRecipeDraft = {
  title: null,
  description: null,
  prep_time_minutes: null,
  cook_time_minutes: null,
  servings: null,
  difficulty: null,
  category: null,
  tags: [],
  ingredients: [],
  instructions: [],
  warnings: [],
  fieldConfidence: {},
};