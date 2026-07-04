"use client";

import { useState, useMemo } from "react";
import { Printer } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { RecipeCard } from "@/components/recipes/recipe-card";
import { RecipeFilters } from "@/components/recipes/recipe-filters";
import { Button } from "@/components/ui/button";
import { TIME_RANGES } from "@/lib/constants";
import type { Recipe } from "@/lib/types";

interface RecipesPageClientProps {
  initialRecipes: Recipe[];
}

export function RecipesPageClient({ initialRecipes }: RecipesPageClientProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState("all");
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);

  const filteredRecipes = useMemo(() => {
    let result = [...initialRecipes];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((r) => {
        const inTitle = r.title.toLowerCase().includes(q);
        const inDesc = r.description?.toLowerCase().includes(q);
        const inTags = r.tags.some((t) => t.toLowerCase().includes(q));
        const inIngredients = r.ingredients?.some((i) =>
          i.name.toLowerCase().includes(q),
        );
        const inInstructions = r.instructions?.some((i) =>
          i.text.toLowerCase().includes(q),
        );
        return inTitle || inDesc || inTags || inIngredients || inInstructions;
      });
    }

    if (category) {
      result = result.filter((r) => r.category === category);
    }

    if (selectedTags.length > 0) {
      result = result.filter((r) =>
        selectedTags.some((t) => r.tags.includes(t)),
      );
    }

    if (timeRange !== "all") {
      const range = TIME_RANGES.find((r) => r.label === timeRange);
      if (range) {
        result = result.filter(
          (r) =>
            r.total_time_minutes != null &&
            r.total_time_minutes >= range.min &&
            r.total_time_minutes <= range.max,
        );
      }
    }

    switch (sort) {
      case "oldest":
        result.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );
        break;
      case "title":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "time":
        result.sort(
          (a, b) =>
            (a.total_time_minutes || 999) - (b.total_time_minutes || 999),
        );
        break;
      default:
        result.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
    }

    return result;
  }, [initialRecipes, search, category, selectedTags, timeRange, sort]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePrintSelected = () => {
    const ids = Array.from(selectedIds).join(",");
    window.open(`/recipes/print?ids=${ids}`, "_blank");
  };

  return (
    <>
      <AppHeader onSearch={setSearch} searchQuery={search} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-serif text-3xl font-bold text-fg">
              All Recipes
            </h1>
            <div className="flex gap-2">
              {selectMode && selectedIds.size > 0 && (
                <Button variant="outline" onClick={handlePrintSelected}>
                  <Printer className="h-4 w-4 mr-1" />
                  Print Selected ({selectedIds.size})
                </Button>
              )}
              <Button
                variant={selectMode ? "secondary" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectMode(!selectMode);
                  setSelectedIds(new Set());
                }}
              >
                {selectMode ? "Cancel" : "Select"}
              </Button>
            </div>
          </div>

          <RecipeFilters
            category={category}
            onCategoryChange={setCategory}
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            sort={sort}
            onSortChange={setSort}
            view={view}
            onViewChange={setView}
          />

          <div className="mt-8">
            {filteredRecipes.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">🔍</div>
                <h2 className="font-serif text-xl font-semibold text-fg mb-2">
                  No recipes found
                </h2>
                <p className="text-fg-secondary">
                  Try adjusting your filters or search terms
                </p>
              </div>
            ) : (
              <div
                className={
                  view === "grid"
                    ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                    : "flex flex-col gap-3"
                }
              >
                {filteredRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    view={view}
                    selectable={selectMode}
                    selected={selectedIds.has(recipe.id)}
                    onSelect={toggleSelect}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
