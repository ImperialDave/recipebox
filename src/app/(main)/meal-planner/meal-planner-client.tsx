"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppHeader } from "@/components/layout/app-header";
import {
  addMealPlanEntry,
  removeMealPlanEntry,
  addToShoppingList,
} from "@/lib/actions/meal-planner";
import type { Recipe } from "@/lib/types";
import { toast } from "sonner";
import { format, addDays, startOfWeek, parseISO } from "date-fns";
import Link from "next/link";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

interface MealPlannerClientProps {
  recipes: Recipe[];
  initialMealPlan: Array<{
    id: string;
    day_of_week: number;
    recipe_id: string;
    recipes: {
      id: string;
      title: string;
      hero_url: string | null;
      total_time_minutes: number | null;
      servings: number | null;
    };
  }>;
  weekStart: string;
}

export function MealPlannerClient({
  recipes,
  initialMealPlan,
  weekStart,
}: MealPlannerClientProps) {
  const [mealPlan, setMealPlan] = useState(initialMealPlan);
  const [currentWeekStart, setCurrentWeekStart] = useState(weekStart);

  const weekDate = parseISO(currentWeekStart);

  const getEntriesForDay = (day: number) =>
    mealPlan.filter((e) => e.day_of_week === day);

  const handleAddMeal = async (day: number, recipeId: string) => {
    try {
      const entry = await addMealPlanEntry(recipeId, day, currentWeekStart);
      setMealPlan([...mealPlan, entry]);
      toast.success("Added to meal plan");
    } catch {
      toast.error("Could not add meal");
    }
  };

  const handleRemoveMeal = async (entryId: string) => {
    try {
      await removeMealPlanEntry(entryId);
      setMealPlan(mealPlan.filter((e) => e.id !== entryId));
      toast.success("Removed from meal plan");
    } catch {
      toast.error("Could not remove meal");
    }
  };

  const handleGenerateShoppingList = async () => {
    const recipeIds = [...new Set(mealPlan.map((e) => e.recipe_id))];
    const plannedRecipes = recipes.filter((r) => recipeIds.includes(r.id));
    const allIngredients: {
      ingredient_name: string;
      quantity: string;
      unit: string;
    }[] = [];

    for (const recipe of plannedRecipes) {
      recipe.ingredients?.forEach((ing) => {
        allIngredients.push({
          ingredient_name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
        });
      });
    }

    if (allIngredients.length === 0) {
      toast.info("No meals planned yet");
      return;
    }

    try {
      await addToShoppingList(allIngredients);
      toast.success(`Added ${allIngredients.length} items to shopping list`);
    } catch {
      toast.error("Could not generate shopping list");
    }
  };

  const changeWeek = (direction: number) => {
    const newStart = format(addDays(weekDate, direction * 7), "yyyy-MM-dd");
    setCurrentWeekStart(newStart);
    setMealPlan([]);
  };

  return (
    <>
      <AppHeader />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-serif text-3xl font-bold text-fg">
                Meal Planner
              </h1>
              <p className="text-fg-secondary mt-1">
                Plan your week, one delicious meal at a time
              </p>
            </div>
            <Button onClick={handleGenerateShoppingList} variant="outline">
              <ShoppingCart className="h-4 w-4 mr-1" />
              Generate Shopping List
            </Button>
          </div>

          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => changeWeek(-1)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="font-serif text-xl font-semibold text-fg">
              Week of {format(weekDate, "MMMM d, yyyy")}
            </h2>
            <Button variant="ghost" onClick={() => changeWeek(1)}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {DAYS.map((dayName, dayIndex) => {
              const entries = getEntriesForDay(dayIndex);
              const dayDate = addDays(weekDate, dayIndex);

              return (
                <Card key={dayName} className="min-h-[200px]">
                  <CardContent className="p-4">
                    <div className="mb-3">
                      <div className="font-semibold text-fg">{dayName}</div>
                      <div className="text-xs text-fg-muted">
                        {format(dayDate, "MMM d")}
                      </div>
                    </div>

                    <div className="space-y-2 mb-3">
                      {entries.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-page text-sm"
                        >
                          <Link
                            href={`/recipes/${entry.recipe_id}`}
                            className="font-medium text-fg-secondary hover:text-accent truncate flex-1"
                          >
                            {entry.recipes?.title || "Recipe"}
                          </Link>
                          <button
                            onClick={() => handleRemoveMeal(entry.id)}
                            className="text-fg-muted hover:text-destructive ml-2 shrink-0"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>

                    <Select onValueChange={(v) => handleAddMeal(dayIndex, v)}>
                      <SelectTrigger className="text-sm h-9">
                        <SelectValue placeholder="+ Add meal" />
                      </SelectTrigger>
                      <SelectContent>
                        {recipes.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
