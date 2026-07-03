import { RecipesPageClient } from "./recipes-client";
import { getRecipes } from "@/lib/queries";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/queries";

export default async function RecipesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const recipes = await getRecipes({ sort: "newest" });

  return <RecipesPageClient initialRecipes={recipes} />;
}