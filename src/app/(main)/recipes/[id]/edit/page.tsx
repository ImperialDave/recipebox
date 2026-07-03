import { AppHeader } from "@/components/layout/app-header";
import { RecipeForm } from "@/components/recipes/recipe-form";
import { getRecipe, getCurrentUser, getUserGroups } from "@/lib/queries";
import { notFound, redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditRecipePage({ params }: Props) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [recipe, groups] = await Promise.all([
    getRecipe(id),
    getUserGroups(),
  ]);

  if (!recipe) notFound();
  if (recipe.owner_id !== user.id) redirect(`/recipes/${id}`);

  return (
    <>
      <AppHeader />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-serif text-3xl font-bold text-brown-800 mb-8">
            Edit Recipe
          </h1>
          <RecipeForm
            recipe={recipe}
            groups={groups.map((g) => ({ id: g.id, name: g.name }))}
          />
        </div>
      </main>
    </>
  );
}