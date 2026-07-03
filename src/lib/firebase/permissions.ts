import { getAdminDb } from "./admin";
import type { GroupRole } from "@/lib/constants";

export async function getUserGroupIds(userId: string): Promise<string[]> {
  const db = getAdminDb();
  const groupsSnap = await db.collection("groups").get();
  const groupIds: string[] = [];

  for (const groupDoc of groupsSnap.docs) {
    const memberDoc = await groupDoc.ref.collection("members").doc(userId).get();
    if (memberDoc.exists) groupIds.push(groupDoc.id);
  }

  return groupIds;
}

export async function getGroupRole(groupId: string, userId: string): Promise<GroupRole | null> {
  const doc = await getAdminDb()
    .collection("groups")
    .doc(groupId)
    .collection("members")
    .doc(userId)
    .get();

  if (!doc.exists) return null;
  return doc.data()?.role as GroupRole;
}

export async function isGroupMember(groupId: string, userId: string): Promise<boolean> {
  const role = await getGroupRole(groupId, userId);
  return role !== null;
}

export async function canViewRecipe(
  recipeId: string,
  userId: string
): Promise<boolean> {
  const db = getAdminDb();
  const recipeDoc = await db.collection("recipes").doc(recipeId).get();
  if (!recipeDoc.exists) return false;

  const recipe = recipeDoc.data()!;
  if (recipe.owner_id === userId) return true;

  if (recipe.is_private || recipe.status !== "published") return false;

  const groupIds: string[] = recipe.group_ids || [];
  for (const groupId of groupIds) {
    if (await isGroupMember(groupId, userId)) return true;
  }

  return false;
}

export async function canEditRecipe(recipeId: string, userId: string): Promise<boolean> {
  const db = getAdminDb();
  const recipeDoc = await db.collection("recipes").doc(recipeId).get();
  if (!recipeDoc.exists) return false;

  const recipe = recipeDoc.data()!;
  if (recipe.owner_id === userId) return true;

  const groupIds: string[] = recipe.group_ids || [];
  for (const groupId of groupIds) {
    const role = await getGroupRole(groupId, userId);
    if (role === "admin" || role === "editor") return true;
  }

  return false;
}

export async function canDeleteRecipe(recipeId: string, userId: string): Promise<boolean> {
  const db = getAdminDb();
  const recipeDoc = await db.collection("recipes").doc(recipeId).get();
  if (!recipeDoc.exists) return false;

  const recipe = recipeDoc.data()!;
  if (recipe.owner_id === userId) return true;

  const groupIds: string[] = recipe.group_ids || [];
  for (const groupId of groupIds) {
    const role = await getGroupRole(groupId, userId);
    if (role === "admin") return true;
  }

  return false;
}