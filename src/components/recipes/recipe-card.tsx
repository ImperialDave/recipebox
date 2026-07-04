"use client";

import Link from "next/link";
import Image from "next/image";
import { Clock, Users, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatMinutes } from "@/lib/utils";
import type { Recipe } from "@/lib/types";
import { toggleFavorite } from "@/lib/actions/recipes";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RecipeCardProps {
  recipe: Recipe;
  view?: "grid" | "list";
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
}

export function RecipeCard({
  recipe,
  view = "grid",
  selectable,
  selected,
  onSelect,
}: RecipeCardProps) {
  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const result = await toggleFavorite(recipe.id);
      toast.success(
        result.favorited ? "Added to favorites" : "Removed from favorites",
      );
    } catch {
      toast.error("Could not update favorite");
    }
  };

  if (view === "list") {
    return (
      <Link href={`/recipes/${recipe.id}`}>
        <Card className="flex gap-4 p-4 hover:shadow-md transition-shadow">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-overlay recipe-image-frame">
            {recipe.hero_url ? (
              <Image
                src={recipe.hero_url}
                alt={recipe.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-3xl">
                🍽️
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-serif text-lg font-semibold text-fg truncate">
                {recipe.title}
              </h3>
              <button onClick={handleFavorite} className="shrink-0 p-1">
                <Star
                  className={cn(
                    "h-5 w-5",
                    recipe.is_favorited
                      ? "fill-warm text-warm"
                      : "text-fg-muted",
                  )}
                />
              </button>
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-fg-secondary">
              <Badge variant="category">{recipe.category}</Badge>
              {recipe.total_time_minutes && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatMinutes(recipe.total_time_minutes)}
                </span>
              )}
              {recipe.servings && (
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {recipe.servings}
                </span>
              )}
            </div>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {recipe.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/recipes/${recipe.id}`}>
      <Card
        className={cn(
          "overflow-hidden group hover:shadow-lg transition-all duration-300",
          selectable && selected && "ring-2 ring-ring",
        )}
        onClick={
          selectable
            ? (e) => {
                e.preventDefault();
                onSelect?.(recipe.id);
              }
            : undefined
        }
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-overlay recipe-image-frame">
          {recipe.hero_url ? (
            <Image
              src={recipe.hero_url}
              alt={recipe.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-5xl bg-gradient-to-br from-overlay to-border">
              🍽️
            </div>
          )}
          <button
            onClick={handleFavorite}
            className="absolute top-3 right-3 p-2 rounded-full bg-elevated/90 shadow-sm hover:bg-elevated transition-colors"
          >
            <Star
              className={cn(
                "h-5 w-5",
                recipe.is_favorited
                  ? "fill-warm text-warm"
                  : "text-fg-muted",
              )}
            />
          </button>
          <Badge variant="category" className="absolute top-3 left-3">
            {recipe.category}
          </Badge>
        </div>
        <div className="p-4">
          <h3 className="font-serif text-lg font-semibold text-fg line-clamp-2">
            {recipe.title}
          </h3>
          <div className="flex items-center gap-3 mt-2 text-sm text-fg-secondary">
            {recipe.total_time_minutes && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatMinutes(recipe.total_time_minutes)}
              </span>
            )}
            {recipe.servings && (
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {recipe.servings} servings
              </span>
            )}
          </div>
          {recipe.tags.length > 0 && (
            <div className="flex gap-1.5 mt-3 flex-wrap">
              {recipe.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
