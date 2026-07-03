import { getAdminDb } from "@/lib/firebase/admin";
import { getSessionUser, getCurrentProfile } from "@/lib/firebase/auth-server";
import { getUserGroupIds } from "@/lib/firebase/permissions";
import { mapRecipeDoc, chunkArray, toISOString } from "@/lib/firebase/helpers";
import type { Recipe, Profile, FamilyGroup, GroupMember, RecipeComment } from "@/lib/types";

export async function getCurrentUser(): Promise<Profile | null> {
  return getCurrentProfile();
}

async function getAccessibleRecipes(userId: string | null): Promise<Recipe[]> {
  const db = getAdminDb();
  const recipeMap = new Map<string, Recipe>();

  if (userId) {
    const ownSnap = await db.collection("recipes").where("owner_id", "==", userId).get();
    ownSnap.docs.forEach((doc) => {
      recipeMap.set(doc.id, mapRecipeDoc(doc.id, doc.data()));
    });

    const groupIds = await getUserGroupIds(userId);
    if (groupIds.length > 0) {
      for (const chunk of chunkArray(groupIds, 10)) {
        const sharedSnap = await db
          .collection("recipes")
          .where("status", "==", "published")
          .where("is_private", "==", false)
          .where("group_ids", "array-contains-any", chunk)
          .get();

        sharedSnap.docs.forEach((doc) => {
          if (!recipeMap.has(doc.id)) {
            recipeMap.set(doc.id, mapRecipeDoc(doc.id, doc.data()));
          }
        });
      }
    }
  } else {
    const pubSnap = await db
      .collection("recipes")
      .where("status", "==", "published")
      .where("is_private", "==", false)
      .get();
    pubSnap.docs.forEach((doc) => {
      recipeMap.set(doc.id, mapRecipeDoc(doc.id, doc.data()));
    });
  }

  return Array.from(recipeMap.values());
}

export async function getRecipes(filters?: {
  search?: string;
  category?: string;
  tags?: string[];
  timeRange?: { min: number; max: number };
  servings?: number;
  sort?: string;
  favoritesOnly?: boolean;
  groupId?: string;
}) {
  const sessionUser = await getSessionUser();
  const userId = sessionUser?.uid || null;
  let result = await getAccessibleRecipes(userId);

  if (filters?.groupId) {
    result = result.filter((r) => r.group_ids?.includes(filters.groupId!));
  }

  if (filters?.category) {
    result = result.filter((r) => r.category === filters.category);
  }

  if (filters?.tags && filters.tags.length > 0) {
    result = result.filter((r) => filters.tags!.some((t) => r.tags.includes(t)));
  }

  if (filters?.timeRange) {
    result = result.filter(
      (r) =>
        r.total_time_minutes != null &&
        r.total_time_minutes >= filters.timeRange!.min &&
        r.total_time_minutes <= filters.timeRange!.max
    );
  }

  if (filters?.servings) {
    result = result.filter((r) => r.servings != null && r.servings >= filters.servings!);
  }

  result = result.filter((r) => r.status === "published" || r.owner_id === userId);

  if (filters?.search) {
    const search = filters.search.toLowerCase();
    result = result.filter((r) => {
      const inTitle = r.title.toLowerCase().includes(search);
      const inDesc = r.description?.toLowerCase().includes(search);
      const inTags = r.tags.some((t) => t.toLowerCase().includes(search));
      const inIngredients = r.ingredients?.some((i) => i.name.toLowerCase().includes(search));
      const inInstructions = r.instructions?.some((i) => i.text.toLowerCase().includes(search));
      return inTitle || inDesc || inTags || inIngredients || inInstructions;
    });
  }

  if (filters?.favoritesOnly && userId) {
    const favSnap = await getAdminDb()
      .collection("favorites")
      .where("user_id", "==", userId)
      .get();
    const favIds = new Set(favSnap.docs.map((d) => d.data().recipe_id));
    result = result.filter((r) => favIds.has(r.id));
  }

  if (userId) {
    const favSnap = await getAdminDb()
      .collection("favorites")
      .where("user_id", "==", userId)
      .get();
    const favIds = new Set(favSnap.docs.map((d) => d.data().recipe_id));
    result = result.map((r) => ({ ...r, is_favorited: favIds.has(r.id) }));
  }

  switch (filters?.sort) {
    case "oldest":
      result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      break;
    case "title":
      result.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "time":
      result.sort((a, b) => (a.total_time_minutes || 999) - (b.total_time_minutes || 999));
      break;
    default:
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  return result;
}

export async function getRecipe(id: string) {
  const sessionUser = await getSessionUser();
  const doc = await getAdminDb().collection("recipes").doc(id).get();
  if (!doc.exists) return null;

  const recipe = mapRecipeDoc(doc.id, doc.data()!);

  if (sessionUser) {
    const favDoc = await getAdminDb()
      .collection("favorites")
      .doc(`${sessionUser.uid}_${id}`)
      .get();
    recipe.is_favorited = favDoc.exists;

    const ownerDoc = await getAdminDb().collection("users").doc(recipe.owner_id).get();
    if (ownerDoc.exists) {
      const owner = ownerDoc.data()!;
      recipe.owner = {
        id: recipe.owner_id,
        email: owner.email || "",
        full_name: owner.full_name || null,
        avatar_url: owner.avatar_url || null,
        onboarding_complete: owner.onboarding_complete ?? false,
        created_at: toISOString(owner.created_at),
        updated_at: toISOString(owner.updated_at),
      };
    }
  }

  return recipe;
}

export async function getRecipeComments(recipeId: string) {
  const snap = await getAdminDb()
    .collection("comments")
    .where("recipe_id", "==", recipeId)
    .orderBy("created_at", "asc")
    .get();

  const comments: RecipeComment[] = [];
  for (const doc of snap.docs) {
    const data = doc.data();
    const profileDoc = await getAdminDb().collection("users").doc(data.user_id).get();
    const profile = profileDoc.data();

    comments.push({
      id: doc.id,
      recipe_id: data.recipe_id,
      user_id: data.user_id,
      content: data.content,
      photo_url: data.photo_url || null,
      created_at: toISOString(data.created_at),
      profile: profile
        ? {
            id: data.user_id,
            email: profile.email || "",
            full_name: profile.full_name || null,
            avatar_url: profile.avatar_url || null,
            onboarding_complete: profile.onboarding_complete ?? false,
            created_at: toISOString(profile.created_at),
            updated_at: toISOString(profile.updated_at),
          }
        : undefined,
    });
  }

  return comments;
}

export async function getUserGroups() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return [];

  const db = getAdminDb();
  const groupsSnap = await db.collection("groups").get();
  const results: (FamilyGroup & { role: string })[] = [];

  for (const groupDoc of groupsSnap.docs) {
    const memberDoc = await groupDoc.ref
      .collection("members")
      .doc(sessionUser.uid)
      .get();

    if (memberDoc.exists) {
      const data = groupDoc.data();
      results.push({
        id: groupDoc.id,
        name: data.name,
        description: data.description || null,
        cover_url: data.cover_url || null,
        invite_code: data.invite_code,
        created_by: data.created_by,
        created_at: toISOString(data.created_at),
        updated_at: toISOString(data.updated_at),
        role: memberDoc.data()?.role || "viewer",
      });
    }
  }

  return results;
}

export async function getGroup(id: string) {
  const doc = await getAdminDb().collection("groups").doc(id).get();
  if (!doc.exists) return null;

  const data = doc.data()!;
  return {
    id: doc.id,
    name: data.name,
    description: data.description || null,
    cover_url: data.cover_url || null,
    invite_code: data.invite_code,
    created_by: data.created_by,
    created_at: toISOString(data.created_at),
    updated_at: toISOString(data.updated_at),
  } as FamilyGroup;
}

export async function getGroupMembers(groupId: string) {
  const snap = await getAdminDb()
    .collection("groups")
    .doc(groupId)
    .collection("members")
    .orderBy("joined_at", "asc")
    .get();

  const members: GroupMember[] = [];
  for (const doc of snap.docs) {
    const data = doc.data();
    const profileDoc = await getAdminDb().collection("users").doc(data.user_id).get();
    const profile = profileDoc.data();

    members.push({
      id: doc.id,
      group_id: groupId,
      user_id: data.user_id,
      role: data.role,
      joined_at: toISOString(data.joined_at),
      profile: profile
        ? {
            id: data.user_id,
            email: profile.email || "",
            full_name: profile.full_name || null,
            avatar_url: profile.avatar_url || null,
            onboarding_complete: profile.onboarding_complete ?? false,
            created_at: toISOString(profile.created_at),
            updated_at: toISOString(profile.updated_at),
          }
        : undefined,
    });
  }

  return members;
}

export async function getMealPlan(weekStart: string) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return [];

  const snap = await getAdminDb()
    .collection("mealPlans")
    .where("user_id", "==", sessionUser.uid)
    .where("week_start", "==", weekStart)
    .orderBy("day_of_week")
    .get();

  const entries = [];
  for (const doc of snap.docs) {
    const data = doc.data();
    const recipeDoc = await getAdminDb().collection("recipes").doc(data.recipe_id).get();
    const recipe = recipeDoc.exists ? mapRecipeDoc(recipeDoc.id, recipeDoc.data()!) : null;

    entries.push({
      id: doc.id,
      day_of_week: data.day_of_week,
      recipe_id: data.recipe_id,
      recipes: recipe
        ? {
            id: recipe.id,
            title: recipe.title,
            hero_url: recipe.hero_url,
            total_time_minutes: recipe.total_time_minutes,
            servings: recipe.servings,
          }
        : {
            id: data.recipe_id,
            title: "Recipe",
            hero_url: null,
            total_time_minutes: null,
            servings: null,
          },
    });
  }

  return entries;
}

export async function getShoppingList() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return [];

  const snap = await getAdminDb()
    .collection("shoppingLists")
    .doc(sessionUser.uid)
    .collection("items")
    .orderBy("category")
    .orderBy("ingredient_name")
    .get();

  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      user_id: sessionUser.uid,
      ingredient_name: data.ingredient_name,
      quantity: data.quantity || "",
      unit: data.unit || "",
      category: data.category || "Other",
      checked: data.checked ?? false,
      created_at: toISOString(data.created_at),
    };
  });
}