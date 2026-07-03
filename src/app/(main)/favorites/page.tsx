import { AppHeader } from "@/components/layout/app-header";
import { RecipeCard } from "@/components/recipes/recipe-card";
import { getCurrentUser, getRecipes } from "@/lib/queries";
import { redirect } from "next/navigation";

export default async function FavoritesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const recipes = await getRecipes({ favoritesOnly: true });

  return (
    <>
      <AppHeader />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-serif text-3xl font-bold text-brown-800 mb-2">My Saved Recipes</h1>
          <p className="text-brown-500 mb-8">Your favorite family recipes, always close at hand</p>

          {recipes.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">⭐</div>
              <h2 className="font-serif text-2xl font-semibold text-brown-800 mb-2">
                No favorites yet
              </h2>
              <p className="text-brown-500">
                Tap the star on any recipe to save it here
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {recipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}