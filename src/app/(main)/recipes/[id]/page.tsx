import { RecipeDetailClient } from "./recipe-detail-client";
import {
  getRecipe,
  getRecipeComments,
  getRecipeEditHistory,
  getCurrentUser,
} from "@/lib/queries";
import { canEditRecipe } from "@/lib/firebase/permissions";
import { notFound, redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RecipeDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [recipe, comments, edits, canEdit] = await Promise.all([
    getRecipe(id),
    getRecipeComments(id),
    getRecipeEditHistory(id),
    canEditRecipe(id, user.id),
  ]);

  if (!recipe) notFound();

  return (
    <RecipeDetailClient
      recipe={recipe}
      comments={comments}
      edits={edits}
      userId={user.id}
      canEdit={canEdit}
    />
  );
}
