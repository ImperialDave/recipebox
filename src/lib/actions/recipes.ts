"use server";

import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { getAdminDb, getAdminStorage } from "@/lib/firebase/admin";
import { requireSessionUser } from "@/lib/firebase/auth-server";
import {
  canEditRecipe,
  canDeleteRecipe,
  canViewRecipe,
} from "@/lib/firebase/permissions";
import {
  mapRecipeDoc,
  prepareIngredients,
  prepareInstructions,
} from "@/lib/firebase/helpers";
import {
  buildEditSummary,
  computeRecipeChanges,
  formDataToSnapshot,
  toRecipeSnapshot,
} from "@/lib/recipe-changes";
import type { RecipeEditChange, RecipeFormData } from "@/lib/types";

async function recordRecipeEdit(
  recipeId: string,
  data: {
    edited_by: string;
    edited_at: Date;
    action: "created" | "updated";
    summary: string;
    changes: RecipeEditChange[];
  },
) {
  const db = getAdminDb();
  await db
    .collection("recipes")
    .doc(recipeId)
    .collection("edits")
    .add(data);
}

export async function createRecipe(data: RecipeFormData) {
  const user = await requireSessionUser();
  const db = getAdminDb();
  const now = new Date();

  const totalTime =
    data.total_time_minutes ??
    ((data.prep_time_minutes || 0) + (data.cook_time_minutes || 0) || null);

  const recipeRef = db.collection("recipes").doc();
  const recipeData = {
    title: data.title,
    description: data.description || null,
    hero_url: data.hero_url,
    gallery_urls: data.gallery_urls,
    prep_time_minutes: data.prep_time_minutes,
    cook_time_minutes: data.cook_time_minutes,
    total_time_minutes: totalTime,
    servings: data.servings,
    difficulty: data.difficulty,
    category: data.category,
    tags: data.tags,
    status: data.status,
    is_private: data.is_private,
    owner_id: user.uid,
    ingredients: prepareIngredients(data.ingredients),
    instructions: prepareInstructions(data.instructions),
    group_ids: data.is_private ? [] : data.group_ids,
    created_at: now,
    updated_at: now,
  };

  await recipeRef.set(recipeData);
  await recordRecipeEdit(recipeRef.id, {
    edited_by: user.uid,
    edited_at: now,
    action: "created",
    summary: "Recipe created",
    changes: [],
  });
  const recipe = mapRecipeDoc(recipeRef.id, recipeData);

  revalidatePath("/recipes");
  revalidatePath("/");
  return recipe;
}

export async function updateRecipe(id: string, data: RecipeFormData) {
  const user = await requireSessionUser();
  if (!(await canEditRecipe(id, user.uid))) throw new Error("Not authorized");

  const db = getAdminDb();
  const recipeRef = db.collection("recipes").doc(id);
  const currentDoc = await recipeRef.get();
  if (!currentDoc.exists) throw new Error("Recipe not found");

  const totalTime =
    data.total_time_minutes ??
    ((data.prep_time_minutes || 0) + (data.cook_time_minutes || 0) || null);

  const now = new Date();
  const before = toRecipeSnapshot(currentDoc.data()!);
  const after = formDataToSnapshot({
    ...data,
    total_time_minutes: totalTime,
    group_ids: data.is_private ? [] : data.group_ids,
    ingredients: prepareIngredients(data.ingredients).map((ing) => ({
      quantity: ing.quantity,
      unit: ing.unit,
      name: ing.name,
      prep_note: ing.prep_note,
    })),
    instructions: prepareInstructions(data.instructions).map((inst) => ({
      text: inst.text,
      timer_minutes: inst.timer_minutes,
    })),
  });
  const changes = computeRecipeChanges(before, after);

  await recipeRef.update({
    title: data.title,
    description: data.description || null,
    hero_url: data.hero_url,
    gallery_urls: data.gallery_urls,
    prep_time_minutes: data.prep_time_minutes,
    cook_time_minutes: data.cook_time_minutes,
    total_time_minutes: totalTime,
    servings: data.servings,
    difficulty: data.difficulty,
    category: data.category,
    tags: data.tags,
    status: data.status,
    is_private: data.is_private,
    ingredients: prepareIngredients(data.ingredients),
    instructions: prepareInstructions(data.instructions),
    group_ids: data.is_private ? [] : data.group_ids,
    updated_at: now,
  });

  if (changes.length > 0) {
    await recordRecipeEdit(id, {
      edited_by: user.uid,
      edited_at: now,
      action: "updated",
      summary: buildEditSummary(changes),
      changes,
    });
  }

  revalidatePath(`/recipes/${id}`);
  revalidatePath("/recipes");
  return { success: true };
}

export async function deleteRecipe(id: string) {
  const user = await requireSessionUser();
  if (!(await canDeleteRecipe(id, user.uid))) throw new Error("Not authorized");

  const db = getAdminDb();
  await db.collection("recipes").doc(id).delete();

  const comments = await db
    .collection("comments")
    .where("recipe_id", "==", id)
    .get();
  const batch = db.batch();
  comments.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();

  revalidatePath("/recipes");
  revalidatePath("/");
}

export async function duplicateRecipe(id: string) {
  const user = await requireSessionUser();
  const originalDoc = await getAdminDb().collection("recipes").doc(id).get();
  if (!originalDoc.exists) throw new Error("Recipe not found");

  const original = originalDoc.data()!;
  const now = new Date();
  const newRef = getAdminDb().collection("recipes").doc();

  const recipeData = {
    ...original,
    title: `${original.title} (Copy)`,
    status: "draft",
    is_private: true,
    owner_id: user.uid,
    group_ids: [],
    created_at: now,
    updated_at: now,
  };

  await newRef.set(recipeData);
  await recordRecipeEdit(newRef.id, {
    edited_by: user.uid,
    edited_at: now,
    action: "created",
    summary: "Recipe created",
    changes: [],
  });
  const recipe = mapRecipeDoc(newRef.id, recipeData);

  revalidatePath("/recipes");
  return recipe;
}

export async function toggleFavorite(recipeId: string) {
  const user = await requireSessionUser();
  const db = getAdminDb();
  const favRef = db.collection("favorites").doc(`${user.uid}_${recipeId}`);
  const favDoc = await favRef.get();

  if (favDoc.exists) {
    await favRef.delete();
    return { favorited: false };
  }

  await favRef.set({
    user_id: user.uid,
    recipe_id: recipeId,
    created_at: new Date(),
  });
  return { favorited: true };
}

export async function addComment(
  recipeId: string,
  content: string,
  photoUrl?: string,
) {
  const user = await requireSessionUser();
  if (!(await canViewRecipe(recipeId, user.uid)))
    throw new Error("Not authorized");

  const db = getAdminDb();
  const commentRef = db.collection("comments").doc();
  const now = new Date();

  await commentRef.set({
    recipe_id: recipeId,
    user_id: user.uid,
    content,
    photo_url: photoUrl || null,
    created_at: now,
  });

  const profileDoc = await db.collection("users").doc(user.uid).get();
  const profile = profileDoc.data();

  revalidatePath(`/recipes/${recipeId}`);
  return {
    id: commentRef.id,
    recipe_id: recipeId,
    user_id: user.uid,
    content,
    photo_url: photoUrl || null,
    created_at: now.toISOString(),
    profile: profile
      ? {
          id: user.uid,
          email: profile.email || user.email || "",
          full_name: profile.full_name || null,
          avatar_url: profile.avatar_url || null,
          onboarding_complete: profile.onboarding_complete ?? false,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        }
      : undefined,
  };
}

export async function uploadRecipeImage(
  file: File,
  folder: string = "recipe-images",
) {
  const user = await requireSessionUser();
  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `${folder}/${user.uid}/${uuidv4()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const bucket = getAdminStorage().bucket();
  const fileRef = bucket.file(fileName);

  await fileRef.save(buffer, {
    metadata: { contentType: file.type },
    public: true,
  });

  return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
}
