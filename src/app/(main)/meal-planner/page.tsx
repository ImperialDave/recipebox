import { MealPlannerClient } from "./meal-planner-client";
import { getCurrentUser, getRecipes, getMealPlan } from "@/lib/queries";
import { redirect } from "next/navigation";
import { startOfWeek, format } from "date-fns";

export default async function MealPlannerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const weekStart = format(
    startOfWeek(new Date(), { weekStartsOn: 0 }),
    "yyyy-MM-dd",
  );
  const [recipes, mealPlan] = await Promise.all([
    getRecipes({ sort: "title" }),
    getMealPlan(weekStart),
  ]);

  return (
    <MealPlannerClient
      recipes={recipes}
      initialMealPlan={mealPlan}
      weekStart={weekStart}
    />
  );
}
