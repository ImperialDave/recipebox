"use client";

import Image from "next/image";
import { formatMinutes } from "@/lib/utils";
import { RecipeAttribution } from "@/components/recipes/recipe-attribution";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import {
  getScaleRatio,
  scaleIngredientQuantity,
} from "@/lib/ingredient-quantity";
import type { Recipe } from "@/lib/types";
import { format } from "date-fns";

interface PrintViewProps {
  recipe: Recipe;
  groupName?: string;
  includePhoto?: boolean;
  /** When set, ingredient quantities and servings reflect this scaled count. */
  targetServings?: number;
}

export function PrintView({
  recipe,
  groupName,
  includePhoto = true,
  targetServings,
}: PrintViewProps) {
  const printedDate = format(new Date(), "MMMM d, yyyy");
  const baseServings =
    recipe.servings && recipe.servings > 0 ? recipe.servings : null;
  const effectiveTarget =
    targetServings != null && targetServings > 0
      ? targetServings
      : baseServings;
  const scaleRatio =
    baseServings != null && effectiveTarget != null
      ? getScaleRatio(baseServings, effectiveTarget)
      : 1;
  const isScaled = scaleRatio !== 1 && baseServings != null;

  return (
    <div className="print-recipe print-only">
      <header className="mb-6 pb-4 border-b-2 border-black">
        <div className="text-sm text-gray-600 mb-1">{APP_NAME}</div>
        {groupName && (
          <div className="text-sm text-gray-600 mb-2">{groupName}</div>
        )}
        <div className="text-xs text-gray-500">Printed {printedDate}</div>
      </header>

      <h1 className="font-serif text-3xl font-bold mb-4">{recipe.title}</h1>

      <RecipeAttribution
        owner={recipe.owner}
        createdAt={recipe.created_at}
        variant="print"
      />

      {(recipe.prep_time_minutes ||
        recipe.cook_time_minutes ||
        recipe.servings) && (
        <div className="flex gap-6 mb-6 text-sm">
          {recipe.prep_time_minutes && (
            <span>
              <strong>Prep:</strong> {formatMinutes(recipe.prep_time_minutes)}
            </span>
          )}
          {recipe.cook_time_minutes && (
            <span>
              <strong>Cook:</strong> {formatMinutes(recipe.cook_time_minutes)}
            </span>
          )}
          {recipe.total_time_minutes && (
            <span>
              <strong>Total:</strong> {formatMinutes(recipe.total_time_minutes)}
            </span>
          )}
          {effectiveTarget != null && (
            <span>
              <strong>Servings:</strong> {effectiveTarget}
              {isScaled && baseServings != null && (
                <span className="text-gray-500">
                  {" "}
                  (scaled from {baseServings})
                </span>
              )}
            </span>
          )}
        </div>
      )}

      {includePhoto && recipe.hero_url && (
        <div className="relative w-full max-h-64 mb-6 overflow-hidden">
          <Image
            src={recipe.hero_url}
            alt={recipe.title}
            width={600}
            height={300}
            className="object-cover w-full"
          />
        </div>
      )}

      {recipe.description && (
        <div className="mb-6 italic text-gray-700 leading-relaxed">
          {recipe.description}
        </div>
      )}

      {isScaled && effectiveTarget != null && (
        <p className="mb-4 text-sm text-gray-600 italic">
          Quantities scaled for {effectiveTarget} servings
          {baseServings != null ? ` (original recipe: ${baseServings})` : ""}.
        </p>
      )}

      <h2 className="font-serif text-xl font-bold mb-3 mt-6">Ingredients</h2>
      <ul className="ingredients-grid list-none space-y-1 mb-8">
        {recipe.ingredients?.map((ing) => {
          const quantity =
            ing.quantity && isScaled
              ? scaleIngredientQuantity(ing.quantity, scaleRatio, {
                  unit: ing.unit,
                  ingredientName: ing.name,
                })
              : ing.quantity;

          return (
            <li key={ing.id} className="flex gap-1">
              <span>
                {quantity && `${quantity} `}
                {ing.unit && `${ing.unit} `}
                <strong>{ing.name}</strong>
                {ing.prep_note && `, ${ing.prep_note}`}
              </span>
            </li>
          );
        })}
      </ul>

      <h2 className="font-serif text-xl font-bold mb-3">Instructions</h2>
      <ol className="space-y-4 mb-8 list-decimal list-inside">
        {recipe.instructions?.map((inst, i) => (
          <li key={inst.id} className="leading-relaxed pl-2">
            <span className="ml-1">{inst.text}</span>
            {inst.timer_minutes && (
              <span className="text-gray-500 text-sm ml-2">
                ({inst.timer_minutes} min)
              </span>
            )}
          </li>
        ))}
      </ol>

      {recipe.tags.length > 0 && (
        <div className="mb-6 text-sm text-gray-600">
          <strong>Tags:</strong> {recipe.tags.join(", ")}
        </div>
      )}

      <div className="print-notes-area">
        <p className="text-sm text-gray-500 mb-2">Notes:</p>
      </div>

      <footer className="mt-8 pt-4 border-t text-xs text-gray-500 text-center">
        Printed from {APP_NAME} • {APP_TAGLINE}
      </footer>
    </div>
  );
}
