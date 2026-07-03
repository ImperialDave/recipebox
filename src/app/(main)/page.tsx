import Link from "next/link";
import { Plus, BookOpen, Heart, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/layout/app-header";
import { RecipeCard } from "@/components/recipes/recipe-card";
import { getCurrentUser, getRecipes, getUserGroups } from "@/lib/queries";
import { APP_NAME } from "@/lib/constants";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [recipes, groups] = await Promise.all([
    getRecipes({ sort: "newest" }),
    getUserGroups(),
  ]);

  const recentRecipes = recipes.slice(0, 6);

  return (
    <>
      <AppHeader userName={user.full_name || undefined} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <section className="mb-10">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brown-800 mb-2">
              Welcome{user.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}! 👋
            </h1>
            <p className="text-lg text-brown-500">
              Your family&apos;s recipes, stories, and traditions — all in one beautiful place.
            </p>
          </section>

          <section className="grid gap-4 sm:grid-cols-3 mb-10">
            <Link href="/recipes/new">
              <div className="flex items-center gap-4 p-5 rounded-2xl bg-sage-600 text-white hover:bg-sage-700 transition-colors">
                <Plus className="h-8 w-8" />
                <div>
                  <div className="font-semibold text-lg">Add Recipe</div>
                  <div className="text-sage-100 text-sm">Share a family favorite</div>
                </div>
              </div>
            </Link>
            <Link href="/recipes">
              <div className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-cream-300 hover:shadow-md transition-shadow">
                <BookOpen className="h-8 w-8 text-sage-600" />
                <div>
                  <div className="font-semibold text-lg text-brown-800">{recipes.length} Recipes</div>
                  <div className="text-brown-500 text-sm">Browse your collection</div>
                </div>
              </div>
            </Link>
            <Link href="/groups">
              <div className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-cream-300 hover:shadow-md transition-shadow">
                <Users className="h-8 w-8 text-terracotta-500" />
                <div>
                  <div className="font-semibold text-lg text-brown-800">{groups.length} Groups</div>
                  <div className="text-brown-500 text-sm">Family recipe sharing</div>
                </div>
              </div>
            </Link>
          </section>

          {recentRecipes.length > 0 ? (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-2xl font-semibold text-brown-800">
                  Recent Recipes
                </h2>
                <Link href="/recipes">
                  <Button variant="outline">View All</Button>
                </Link>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {recentRecipes.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            </section>
          ) : (
            <section className="text-center py-16">
              <div className="text-6xl mb-4">📖</div>
              <h2 className="font-serif text-2xl font-semibold text-brown-800 mb-2">
                Your recipe box is waiting
              </h2>
              <p className="text-brown-500 mb-6 max-w-md mx-auto">
                Create a family group to get started with sample recipes, or add your first family favorite!
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/groups/new">
                  <Button size="lg">Create Family Group</Button>
                </Link>
                <Link href="/recipes/new">
                  <Button variant="outline" size="lg">Add a Recipe</Button>
                </Link>
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}