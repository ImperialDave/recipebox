"use server";

import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireSessionUser } from "@/lib/firebase/auth-server";
import { getGroupRole } from "@/lib/firebase/permissions";
import { generateInviteCode } from "@/lib/utils";
import { SEED_RECIPES } from "@/lib/seed-recipes";
import {
  prepareIngredients,
  prepareInstructions,
} from "@/lib/firebase/helpers";
import type { GroupRole } from "@/lib/constants";

export async function createGroup(
  name: string,
  description?: string,
  coverUrl?: string,
) {
  const user = await requireSessionUser();
  const db = getAdminDb();
  const now = new Date();
  const groupRef = db.collection("groups").doc();

  const groupData = {
    name,
    description: description || null,
    cover_url: coverUrl || null,
    invite_code: generateInviteCode(),
    created_by: user.uid,
    created_at: now,
    updated_at: now,
  };

  await groupRef.set(groupData);
  await groupRef.collection("members").doc(user.uid).set({
    user_id: user.uid,
    role: "admin",
    joined_at: now,
  });

  for (const seedRecipe of SEED_RECIPES) {
    const recipeRef = db.collection("recipes").doc();
    const totalTime = seedRecipe.total_time_minutes;

    await recipeRef.set({
      title: seedRecipe.title,
      description: seedRecipe.description,
      hero_url: seedRecipe.hero_url,
      gallery_urls: seedRecipe.gallery_urls,
      prep_time_minutes: seedRecipe.prep_time_minutes,
      cook_time_minutes: seedRecipe.cook_time_minutes,
      total_time_minutes: totalTime,
      servings: seedRecipe.servings,
      difficulty: seedRecipe.difficulty,
      category: seedRecipe.category,
      tags: seedRecipe.tags,
      status: seedRecipe.status,
      is_private: false,
      owner_id: user.uid,
      ingredients: prepareIngredients(seedRecipe.ingredients),
      instructions: prepareInstructions(seedRecipe.instructions),
      group_ids: [groupRef.id],
      created_at: now,
      updated_at: now,
    });
  }

  revalidatePath("/groups");
  revalidatePath("/recipes");
  revalidatePath("/");

  return {
    id: groupRef.id,
    ...groupData,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };
}

export async function joinGroup(inviteCode: string) {
  const user = await requireSessionUser();
  const db = getAdminDb();

  const snap = await db
    .collection("groups")
    .where("invite_code", "==", inviteCode.toUpperCase())
    .limit(1)
    .get();

  if (snap.empty) throw new Error("Invalid invite code");

  const groupDoc = snap.docs[0];
  const memberRef = groupDoc.ref.collection("members").doc(user.uid);
  const existing = await memberRef.get();

  if (existing.exists) {
    return { groupId: groupDoc.id, alreadyMember: true };
  }

  await memberRef.set({
    user_id: user.uid,
    role: "viewer",
    joined_at: new Date(),
  });

  revalidatePath("/groups");
  return { groupId: groupDoc.id, alreadyMember: false };
}

export async function updateMemberRole(
  groupId: string,
  memberId: string,
  role: GroupRole,
) {
  const user = await requireSessionUser();
  if ((await getGroupRole(groupId, user.uid)) !== "admin") {
    throw new Error("Not authorized");
  }

  await getAdminDb()
    .collection("groups")
    .doc(groupId)
    .collection("members")
    .doc(memberId)
    .update({ role });

  revalidatePath(`/groups/${groupId}`);
}

export async function removeMember(groupId: string, memberId: string) {
  const user = await requireSessionUser();
  if ((await getGroupRole(groupId, user.uid)) !== "admin") {
    throw new Error("Not authorized");
  }

  await getAdminDb()
    .collection("groups")
    .doc(groupId)
    .collection("members")
    .doc(memberId)
    .delete();

  revalidatePath(`/groups/${groupId}`);
}

export async function leaveGroup(groupId: string) {
  const user = await requireSessionUser();

  await getAdminDb()
    .collection("groups")
    .doc(groupId)
    .collection("members")
    .doc(user.uid)
    .delete();

  revalidatePath("/groups");
}

export async function updateGroup(
  groupId: string,
  data: { name?: string; description?: string; cover_url?: string },
) {
  const user = await requireSessionUser();
  if ((await getGroupRole(groupId, user.uid)) !== "admin") {
    throw new Error("Not authorized");
  }

  await getAdminDb()
    .collection("groups")
    .doc(groupId)
    .update({ ...data, updated_at: new Date() });

  revalidatePath(`/groups/${groupId}`);
}

export async function deleteGroup(groupId: string) {
  const user = await requireSessionUser();
  if ((await getGroupRole(groupId, user.uid)) !== "admin") {
    throw new Error("Not authorized");
  }

  const db = getAdminDb();
  const members = await db
    .collection("groups")
    .doc(groupId)
    .collection("members")
    .get();
  const batch = db.batch();
  members.docs.forEach((doc) => batch.delete(doc.ref));
  batch.delete(db.collection("groups").doc(groupId));
  await batch.commit();

  revalidatePath("/groups");
}
