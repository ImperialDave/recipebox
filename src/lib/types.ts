import type { GroupRole } from "./constants";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface FamilyGroup {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  invite_code: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: GroupRole;
  joined_at: string;
  profile?: Profile;
}

export interface Ingredient {
  id: string;
  quantity: string;
  unit: string;
  name: string;
  prep_note: string;
  sort_order: number;
}

export interface Instruction {
  id: string;
  text: string;
  timer_minutes: number | null;
  sort_order: number;
}

export interface Recipe {
  id: string;
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
  status: "draft" | "published";
  is_private: boolean;
  owner_id: string;
  created_at: string;
  updated_at: string;
  ingredients?: Ingredient[];
  instructions?: Instruction[];
  owner?: Profile;
  is_favorited?: boolean;
  group_ids?: string[];
}

export interface RecipeEditChange {
  field: string;
  label: string;
  before: string;
  after: string;
  details?: string[];
}

export interface RecipeEdit {
  id: string;
  recipe_id: string;
  edited_by: string;
  edited_at: string;
  action: "created" | "updated";
  summary: string;
  changes: RecipeEditChange[];
  editor?: Profile;
}

export interface RecipeComment {
  id: string;
  recipe_id: string;
  user_id: string;
  content: string;
  photo_url: string | null;
  created_at: string;
  profile?: Profile;
}

export interface Favorite {
  id: string;
  user_id: string;
  recipe_id: string;
  created_at: string;
}

export interface MealPlanEntry {
  id: string;
  user_id: string;
  group_id: string | null;
  recipe_id: string;
  day_of_week: number;
  week_start: string;
  created_at: string;
  recipe?: Recipe;
}

export interface ShoppingListItem {
  id: string;
  user_id: string;
  ingredient_name: string;
  quantity: string;
  unit: string;
  category: string;
  checked: boolean;
  created_at: string;
}

export interface RecipeFormData {
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
  status: "draft" | "published";
  is_private: boolean;
  group_ids: string[];
  ingredients: Omit<Ingredient, "id">[];
  instructions: Omit<Instruction, "id">[];
}
