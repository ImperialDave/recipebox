"use server";

import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireSessionUser } from "@/lib/firebase/auth-server";
import { mapRecipeDoc } from "@/lib/firebase/helpers";

export async function addMealPlanEntry(
  recipeId: string,
  dayOfWeek: number,
  weekStart: string,
  groupId?: string
) {
  const user = await requireSessionUser();
  const db = getAdminDb();
  const ref = db.collection("mealPlans").doc();
  const now = new Date();

  const entryData = {
    user_id: user.uid,
    recipe_id: recipeId,
    day_of_week: dayOfWeek,
    week_start: weekStart,
    group_id: groupId || null,
    created_at: now,
  };

  await ref.set(entryData);

  const recipeDoc = await db.collection("recipes").doc(recipeId).get();
  const recipe = recipeDoc.exists ? mapRecipeDoc(recipeDoc.id, recipeDoc.data()!) : null;

  revalidatePath("/meal-planner");
  return {
    id: ref.id,
    day_of_week: dayOfWeek,
    recipe_id: recipeId,
    recipes: recipe
      ? {
          id: recipe.id,
          title: recipe.title,
          hero_url: recipe.hero_url,
          total_time_minutes: recipe.total_time_minutes,
          servings: recipe.servings,
        }
      : {
          id: recipeId,
          title: "Recipe",
          hero_url: null,
          total_time_minutes: null,
          servings: null,
        },
  };
}

export async function removeMealPlanEntry(entryId: string) {
  await requireSessionUser();
  await getAdminDb().collection("mealPlans").doc(entryId).delete();
  revalidatePath("/meal-planner");
}

export async function addToShoppingList(
  items: { ingredient_name: string; quantity: string; unit: string; category?: string }[]
) {
  const user = await requireSessionUser();
  const db = getAdminDb();
  const batch = db.batch();
  const now = new Date();

  for (const item of items) {
    const ref = db
      .collection("shoppingLists")
      .doc(user.uid)
      .collection("items")
      .doc();
    batch.set(ref, {
      ingredient_name: item.ingredient_name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category || "Other",
      checked: false,
      created_at: now,
    });
  }

  await batch.commit();
  revalidatePath("/shopping-list");
  return { success: true };
}

export async function toggleShoppingItem(itemId: string, checked: boolean) {
  const user = await requireSessionUser();
  await getAdminDb()
    .collection("shoppingLists")
    .doc(user.uid)
    .collection("items")
    .doc(itemId)
    .update({ checked });

  revalidatePath("/shopping-list");
}

export async function clearCheckedShoppingItems() {
  const user = await requireSessionUser();
  const db = getAdminDb();
  const snap = await db
    .collection("shoppingLists")
    .doc(user.uid)
    .collection("items")
    .where("checked", "==", true)
    .get();

  const batch = db.batch();
  snap.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();

  revalidatePath("/shopping-list");
}

export async function deleteShoppingItem(itemId: string) {
  const user = await requireSessionUser();
  await getAdminDb()
    .collection("shoppingLists")
    .doc(user.uid)
    .collection("items")
    .doc(itemId)
    .delete();

  revalidatePath("/shopping-list");
}