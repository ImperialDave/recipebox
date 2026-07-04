import { RecipeDetailClient } from "./recipe-detail-client";
import { getRecipe, getRecipeComments, getCurrentUser } from "@/lib/queries";
import { notFound, redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RecipeDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [recipe, comments] = await Promise.all([
    getRecipe(id),
    getRecipeComments(id),
  ]);

  if (!recipe) notFound();

  return (
    <RecipeDetailClient recipe={recipe} comments={comments} userId={user.id} />
  );
}
