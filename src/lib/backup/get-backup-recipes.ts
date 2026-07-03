import { getRecipes } from "@/lib/queries";
import type { Recipe } from "@/lib/types";

export async function getBackupRecipes(
  userId: string,
  ownedOnly: boolean
): Promise<Recipe[]> {
  const recipes = await getRecipes({ sort: "title" });

  if (ownedOnly) {
    return recipes.filter((r) => r.owner_id === userId);
  }

  return recipes;
}