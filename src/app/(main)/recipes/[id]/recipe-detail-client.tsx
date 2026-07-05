"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  Users,
  Printer,
  Pencil,
  Copy,
  Star,
  Trash2,
  ChefHat,
  ArrowLeft,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CookingMode } from "@/components/recipes/cooking-mode";
import { PrintView } from "@/components/recipes/print-view";
import { ServingScaler } from "@/components/recipes/serving-scaler";
import {
  getScaleRatio,
  scaleIngredientQuantity,
} from "@/lib/ingredient-quantity";
import { RecipeAttribution } from "@/components/recipes/recipe-attribution";
import { RecipeEditHistory } from "@/components/recipes/recipe-edit-history";
import { formatMinutes } from "@/lib/utils";
import {
  toggleFavorite,
  duplicateRecipe,
  deleteRecipe,
  addComment,
} from "@/lib/actions/recipes";
import { addToShoppingList } from "@/lib/actions/meal-planner";
import type { Recipe, RecipeComment, RecipeEdit } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RecipeDetailClientProps {
  recipe: Recipe;
  comments: RecipeComment[];
  edits: RecipeEdit[];
  userId: string;
  canEdit: boolean;
}

export function RecipeDetailClient({
  recipe,
  comments: initialComments,
  edits,
  userId,
  canEdit,
}: RecipeDetailClientProps) {
  const router = useRouter();
  const [cookingMode, setCookingMode] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(
    new Set(),
  );
  const [favorited, setFavorited] = useState(recipe.is_favorited);
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");
  const [deleteDialog, setDeleteDialog] = useState(false);
  const baseServings = recipe.servings && recipe.servings > 0 ? recipe.servings : null;
  const [targetServings, setTargetServings] = useState(baseServings ?? 4);
  const scaleRatio =
    baseServings != null ? getScaleRatio(baseServings, targetServings) : 1;
  const [includePhotoInPrint, setIncludePhotoInPrint] = useState(true);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  const isOwner = recipe.owner_id === userId;
  const lastUpdatedEdit = edits.find((edit) => edit.action === "updated");

  const handleFavorite = async () => {
    try {
      const result = await toggleFavorite(recipe.id);
      setFavorited(result.favorited);
      toast.success(
        result.favorited ? "Added to favorites" : "Removed from favorites",
      );
    } catch {
      toast.error("Could not update favorite");
    }
  };

  const handleDuplicate = async () => {
    try {
      const copy = await duplicateRecipe(recipe.id);
      toast.success("Recipe duplicated!");
      router.push(`/recipes/${copy.id}/edit`);
    } catch {
      toast.error("Could not duplicate recipe");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteRecipe(recipe.id);
      toast.success("Recipe deleted");
      router.push("/recipes");
    } catch {
      toast.error("Could not delete recipe");
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const comment = await addComment(recipe.id, newComment);
      setComments([...comments, comment]);
      setNewComment("");
      toast.success("Comment added");
    } catch {
      toast.error("Could not add comment");
    }
  };

  const handleAddMissingToShoppingList = async () => {
    const unchecked =
      recipe.ingredients?.filter((i) => !checkedIngredients.has(i.id)) || [];
    if (unchecked.length === 0) {
      toast.info("All ingredients are checked off!");
      return;
    }
    try {
      await addToShoppingList(
        unchecked.map((i) => ({
          ingredient_name: i.name,
          quantity: scaleIngredientQuantity(i.quantity, scaleRatio, {
            unit: i.unit,
            ingredientName: i.name,
          }),
          unit: i.unit,
        })),
      );
      toast.success(`Added ${unchecked.length} items to shopping list`);
    } catch {
      toast.error("Could not add to shopping list");
    }
  };

  const handlePrint = () => {
    setShowPrintPreview(true);
    setTimeout(() => window.print(), 300);
  };

  const displayQuantity = (quantity: string, unit: string, name: string) =>
    scaleIngredientQuantity(quantity, scaleRatio, {
      unit,
      ingredientName: name,
    });

  if (cookingMode && recipe.instructions) {
    return (
      <CookingMode
        title={recipe.title}
        instructions={recipe.instructions}
        onClose={() => setCookingMode(false)}
      />
    );
  }

  return (
    <>
      <PrintView
        recipe={recipe}
        includePhoto={includePhotoInPrint}
        targetServings={baseServings != null ? targetServings : undefined}
      />

      <div className="no-print">
        <div className="relative">
          <div className="relative h-64 sm:h-80 lg:h-96 bg-overlay">
            {recipe.hero_url ? (
              <Image
                src={recipe.hero_url}
                alt={recipe.title}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-8xl bg-gradient-to-br from-overlay to-border">
                🍽️
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
              <Link
                href="/recipes"
                className="inline-flex items-center text-white/80 hover:text-white mb-3 text-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to recipes
              </Link>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white">
                {recipe.title}
              </h1>
              <div className="flex items-center gap-4 mt-3 text-white/90 text-sm">
                <Badge variant="category">{recipe.category}</Badge>
                {recipe.total_time_minutes && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatMinutes(recipe.total_time_minutes)}
                  </span>
                )}
                {recipe.servings && (
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {recipe.servings} servings
                  </span>
                )}
                {recipe.difficulty && <span>{recipe.difficulty}</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="sticky top-0 z-30 bg-page/95 backdrop-blur border-b border-border px-4 py-3">
          <div className="max-w-4xl mx-auto flex flex-wrap gap-2">
            <Button size="lg" onClick={() => setCookingMode(true)}>
              <ChefHat className="h-5 w-5 mr-2" />
              Start Cooking
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-1" />
              Print
            </Button>
            <Button variant="outline" onClick={handleFavorite}>
              <Star
                className={cn(
                  "h-4 w-4 mr-1",
                  favorited && "fill-warm text-warm",
                )}
              />
              {favorited ? "Saved" : "Save"}
            </Button>
            <Button variant="outline" onClick={handleDuplicate}>
              <Copy className="h-4 w-4 mr-1" />
              Duplicate
            </Button>
            {canEdit && (
              <Link href={`/recipes/${recipe.id}/edit`}>
                <Button variant="outline">
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </Link>
            )}
            {isOwner && (
              <Button
                variant="outline"
                onClick={() => setDeleteDialog(true)}
                className="text-destructive "
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            )}
          </div>
        </div>

        <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-10">
          <RecipeAttribution
            owner={recipe.owner}
            createdAt={recipe.created_at}
            lastEdit={lastUpdatedEdit}
          />

          {recipe.description && (
            <section>
              <h2 className="font-serif text-2xl font-semibold text-fg mb-3">
                Family Story
              </h2>
              <p className="text-fg-secondary leading-relaxed text-lg whitespace-pre-wrap">
                {recipe.description}
              </p>
            </section>
          )}

          <section>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-4">
              <h2 className="font-serif text-2xl font-semibold text-fg">
                Ingredients
              </h2>
              {baseServings != null ? (
                <ServingScaler
                  baseServings={baseServings}
                  targetServings={targetServings}
                  onChange={setTargetServings}
                />
              ) : (
                <p className="text-sm text-fg-muted max-w-xs text-right">
                  Add a serving size in{" "}
                  {canEdit ? (
                    <Link
                      href={`/recipes/${recipe.id}/edit`}
                      className="text-accent hover:underline"
                    >
                      edit recipe
                    </Link>
                  ) : (
                    "recipe settings"
                  )}{" "}
                  to scale ingredients.
                </p>
              )}
            </div>
            <ul className="space-y-3">
              {recipe.ingredients?.map((ing) => {
                const quantity = displayQuantity(
                  ing.quantity,
                  ing.unit,
                  ing.name,
                );
                return (
                <li key={ing.id} className="flex items-start gap-3">
                  <Checkbox
                    checked={checkedIngredients.has(ing.id)}
                    onCheckedChange={(checked) => {
                      setCheckedIngredients((prev) => {
                        const next = new Set(prev);
                        if (checked) next.add(ing.id);
                        else next.delete(ing.id);
                        return next;
                      });
                    }}
                    className="mt-1"
                  />
                  <span
                    className={cn(
                      "text-lg leading-relaxed",
                      checkedIngredients.has(ing.id) &&
                        "line-through text-fg-muted",
                    )}
                  >
                    {quantity && `${quantity} `}
                    {ing.unit && `${ing.unit} `}
                    <strong>{ing.name}</strong>
                    {ing.prep_note && (
                      <span className="text-fg-secondary">
                        , {ing.prep_note}
                      </span>
                    )}
                  </span>
                </li>
                );
              })}
            </ul>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={handleAddMissingToShoppingList}
            >
              Add unchecked to shopping list
            </Button>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-fg mb-4">
              Instructions
            </h2>
            <ol className="space-y-6">
              {recipe.instructions?.map((inst, i) => (
                <li key={inst.id} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-accent font-bold">
                    {i + 1}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-lg leading-relaxed text-fg-secondary">
                      {inst.text}
                    </p>
                    {inst.timer_minutes && (
                      <span className="inline-flex items-center gap-1 mt-2 text-sm text-fg-secondary">
                        <Clock className="h-3.5 w-3.5" />
                        {inst.timer_minutes} min
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {recipe.tags.length > 0 && (
            <section>
              <h2 className="font-serif text-xl font-semibold text-fg mb-3">
                Tags
              </h2>
              <div className="flex flex-wrap gap-2">
                {recipe.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/recipes?tag=${encodeURIComponent(tag)}`}
                  >
                    <Badge
                      variant="outline"
                      className="cursor-pointer hover:bg-overlay"
                    >
                      {tag}
                    </Badge>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <RecipeEditHistory edits={edits} />

          <section>
            <h2 className="font-serif text-2xl font-semibold text-fg mb-4 flex items-center gap-2">
              <MessageCircle className="h-6 w-6" />
              Family Notes ({comments.length})
            </h2>
            <div className="space-y-4 mb-6">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="flex gap-3 p-4 rounded-xl bg-elevated border border-border"
                >
                  <Avatar>
                    <AvatarImage
                      src={comment.profile?.avatar_url || undefined}
                    />
                    <AvatarFallback>
                      {comment.profile?.full_name?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-fg">
                      {comment.profile?.full_name || "Family Member"}
                    </div>
                    <p className="text-fg-secondary mt-1">{comment.content}</p>
                    <time className="text-xs text-fg-muted mt-1 block">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </time>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Textarea
                placeholder="Share a tip, memory, or how it turned out..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleAddComment} className="self-end">
                Post
              </Button>
            </div>
          </section>
        </main>

        <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete this recipe?</DialogTitle>
              <DialogDescription>
                &quot;{recipe.title}&quot; will be permanently removed. This
                cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete Recipe
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
