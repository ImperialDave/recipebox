"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, GripVertical, Upload, X } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FOOD_CATEGORIES,
  SUGGESTED_TAGS,
  UNITS,
  DIFFICULTY_LEVELS,
  UTILITY_CATEGORIES,
} from "@/lib/constants";
import {
  createRecipe,
  updateRecipe,
  uploadRecipeImage,
} from "@/lib/actions/recipes";
import {
  isSupportedImageFile,
  prepareImageFileForUpload,
} from "@/lib/image/prepare-image-file";
import type { RecipeFormData, Recipe } from "@/lib/types";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

interface RecipeFormProps {
  recipe?: Recipe;
  groups?: { id: string; name: string }[];
  initialForm?: Partial<RecipeFormData>;
}

function buildFormState(
  recipe?: Recipe,
  initialForm?: Partial<RecipeFormData>,
): RecipeFormData {
  const base: RecipeFormData = {
    title: recipe?.title || "",
    description: recipe?.description || "",
    hero_url: recipe?.hero_url || null,
    gallery_urls: recipe?.gallery_urls || [],
    prep_time_minutes: recipe?.prep_time_minutes || null,
    cook_time_minutes: recipe?.cook_time_minutes || null,
    total_time_minutes: recipe?.total_time_minutes || null,
    servings: recipe?.servings || null,
    difficulty: recipe?.difficulty || null,
    category: recipe?.category || "Dinner",
    tags: recipe?.tags || [],
    status: recipe?.status || "published",
    is_private: recipe?.is_private ?? true,
    group_ids: recipe?.group_ids || [],
    ingredients: recipe?.ingredients?.map((i) => ({
      quantity: i.quantity,
      unit: i.unit,
      name: i.name,
      prep_note: i.prep_note,
      sort_order: i.sort_order,
    })) || [{ quantity: "", unit: "", name: "", prep_note: "", sort_order: 0 }],
    instructions: recipe?.instructions?.map((i) => ({
      text: i.text,
      timer_minutes: i.timer_minutes,
      sort_order: i.sort_order,
    })) || [{ text: "", timer_minutes: null, sort_order: 0 }],
  };

  if (!initialForm) return base;

  return {
    ...base,
    ...initialForm,
    gallery_urls: initialForm.gallery_urls ?? base.gallery_urls,
    tags: initialForm.tags ?? base.tags,
    group_ids: initialForm.group_ids ?? base.group_ids,
    ingredients: initialForm.ingredients ?? base.ingredients,
    instructions: initialForm.instructions ?? base.instructions,
  };
}

function SortableIngredient({
  id,
  ingredient,
  onChange,
  onRemove,
}: {
  id: string;
  ingredient: {
    quantity: string;
    unit: string;
    name: string;
    prep_note: string;
    sort_order: number;
  };
  onChange: (field: string, value: string) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 group"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab p-1 text-fg-muted hover:text-fg-secondary"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <Input
        placeholder="Qty"
        value={ingredient.quantity}
        onChange={(e) => onChange("quantity", e.target.value)}
        className="w-20"
      />
      <Select
        value={ingredient.unit}
        onValueChange={(v) => onChange("unit", v)}
      >
        <SelectTrigger className="w-24">
          <SelectValue placeholder="Unit" />
        </SelectTrigger>
        <SelectContent>
          {UNITS.map((u) => (
            <SelectItem key={u || "none"} value={u || "none"}>
              {u || "—"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        placeholder="Ingredient"
        value={ingredient.name}
        onChange={(e) => onChange("name", e.target.value)}
        className="flex-1"
      />
      <Input
        placeholder="Prep note"
        value={ingredient.prep_note}
        onChange={(e) => onChange("prep_note", e.target.value)}
        className="w-32"
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100"
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

function SortableInstruction({
  id,
  instruction,
  index,
  onChange,
  onRemove,
}: {
  id: string;
  instruction: {
    text: string;
    timer_minutes: number | null;
    sort_order: number;
  };
  index: number;
  onChange: (field: string, value: string | number | null) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="flex gap-2 group">
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab p-1 mt-3 text-fg-muted"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-accent font-semibold text-sm mt-2">
        {index + 1}
      </div>
      <div className="flex-1 space-y-2">
        <Textarea
          placeholder="Describe this step..."
          value={instruction.text}
          onChange={(e) => onChange("text", e.target.value)}
          className="min-h-[80px]"
        />
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Timer (min)"
            value={instruction.timer_minutes ?? ""}
            onChange={(e) =>
              onChange(
                "timer_minutes",
                e.target.value ? parseInt(e.target.value) : null,
              )
            }
            className="w-32"
          />
          <span className="text-sm text-fg-secondary">optional timer</span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="mt-2 opacity-0 group-hover:opacity-100"
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

export function RecipeForm({
  recipe,
  groups = [],
  initialForm,
}: RecipeFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState<RecipeFormData>(() =>
    buildFormState(recipe, initialForm),
  );

  const [ingredientIds] = useState(() => form.ingredients.map(() => uuidv4()));
  const [instructionIds] = useState(() =>
    form.instructions.map(() => uuidv4()),
  );
  const [customTag, setCustomTag] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isSupportedImageFile(file)) {
      toast.error("Please choose a JPG, PNG, WebP, or iPhone photo");
      return;
    }
    setUploading(true);
    try {
      const prepared = await prepareImageFileForUpload(file);
      const url = await uploadRecipeImage(prepared);
      setForm((f) => ({ ...f, hero_url: url }));
      toast.success("Photo uploaded");
    } catch {
      toast.error("Upload failed. Try another photo.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const toggleTag = (tag: string) => {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag)
        ? f.tags.filter((t) => t !== tag)
        : [...f.tags, tag],
    }));
  };

  const addCustomTag = () => {
    if (customTag && !form.tags.includes(customTag)) {
      setForm((f) => ({ ...f, tags: [...f.tags, customTag] }));
      setCustomTag("");
    }
  };

  const handleIngredientDrag = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ingredientIds.indexOf(active.id as string);
    const newIndex = ingredientIds.indexOf(over.id as string);
    setForm((f) => ({
      ...f,
      ingredients: arrayMove(f.ingredients, oldIndex, newIndex),
    }));
  };

  const handleInstructionDrag = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = instructionIds.indexOf(active.id as string);
    const newIndex = instructionIds.indexOf(over.id as string);
    setForm((f) => ({
      ...f,
      instructions: arrayMove(f.instructions, oldIndex, newIndex),
    }));
  };

  const handleSubmit = async (asDraft = false) => {
    if (!form.title.trim()) {
      toast.error("Please add a title");
      return;
    }
    setSaving(true);
    try {
      const data = {
        ...form,
        status: asDraft ? ("draft" as const) : form.status,
      };
      if (recipe) {
        await updateRecipe(recipe.id, data);
        toast.success("Recipe updated!");
        router.push(`/recipes/${recipe.id}`);
      } else {
        const created = await createRecipe(data);
        toast.success("Recipe created!");
        router.push(`/recipes/${created.id}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-24">
      <Card>
        <CardHeader>
          <CardTitle>Basic Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Recipe Title *</Label>
            <Input
              id="title"
              placeholder="Grandma's Famous Apple Pie"
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              className="text-lg mt-1"
            />
          </div>
          <div>
            <Label htmlFor="description">Family Story / Description</Label>
            <Textarea
              id="description"
              placeholder="Share the story behind this recipe..."
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              className="mt-1 min-h-[120px]"
            />
          </div>
          <div>
            <Label>Hero Photo</Label>
            <div className="mt-2 flex items-center gap-4">
              {form.hero_url ? (
                <div className="relative">
                  <img
                    src={form.hero_url}
                    alt="Hero"
                    className="h-32 w-48 object-cover rounded-xl"
                  />
                  <button
                    onClick={() => setForm((f) => ({ ...f, hero_url: null }))}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-32 w-48 border-2 border-dashed border-border-strong rounded-xl cursor-pointer hover:border-accent transition-colors">
                  <Upload className="h-8 w-8 text-fg-muted mb-2" />
                  <span className="text-sm text-fg-secondary">
                    {uploading ? "Uploading..." : "Drag & drop or click"}
                  </span>
                  <input
                    type="file"
                    accept="image/*,.heic,.heif"
                    capture="environment"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <Label>Prep Time (min)</Label>
              <Input
                type="number"
                value={form.prep_time_minutes ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    prep_time_minutes: e.target.value
                      ? parseInt(e.target.value)
                      : null,
                  }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Cook Time (min)</Label>
              <Input
                type="number"
                value={form.cook_time_minutes ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    cook_time_minutes: e.target.value
                      ? parseInt(e.target.value)
                      : null,
                  }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Servings</Label>
              <Input
                type="number"
                value={form.servings ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    servings: e.target.value ? parseInt(e.target.value) : null,
                  }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Difficulty</Label>
              <Select
                value={form.difficulty || ""}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, difficulty: v || null }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_LEVELS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4">
            <Label>Category</Label>
            <Select
              value={form.category}
              onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {FOOD_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  {UTILITY_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Ingredients</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              ingredientIds.push(uuidv4());
              setForm((f) => ({
                ...f,
                ingredients: [
                  ...f.ingredients,
                  {
                    quantity: "",
                    unit: "",
                    name: "",
                    prep_note: "",
                    sort_order: f.ingredients.length,
                  },
                ],
              }));
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleIngredientDrag}
          >
            <SortableContext
              items={ingredientIds}
              strategy={verticalListSortingStrategy}
            >
              {form.ingredients.map((ing, i) => (
                <SortableIngredient
                  key={ingredientIds[i]}
                  id={ingredientIds[i]}
                  ingredient={ing}
                  onChange={(field, value) => {
                    setForm((f) => {
                      const ingredients = [...f.ingredients];
                      ingredients[i] = { ...ingredients[i], [field]: value };
                      return { ...f, ingredients };
                    });
                  }}
                  onRemove={() => {
                    setForm((f) => ({
                      ...f,
                      ingredients: f.ingredients.filter((_, idx) => idx !== i),
                    }));
                  }}
                />
              ))}
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Instructions</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              instructionIds.push(uuidv4());
              setForm((f) => ({
                ...f,
                instructions: [
                  ...f.instructions,
                  {
                    text: "",
                    timer_minutes: null,
                    sort_order: f.instructions.length,
                  },
                ],
              }));
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Step
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleInstructionDrag}
          >
            <SortableContext
              items={instructionIds}
              strategy={verticalListSortingStrategy}
            >
              {form.instructions.map((inst, i) => (
                <SortableInstruction
                  key={instructionIds[i]}
                  id={instructionIds[i]}
                  instruction={inst}
                  index={i}
                  onChange={(field, value) => {
                    setForm((f) => {
                      const instructions = [...f.instructions];
                      instructions[i] = { ...instructions[i], [field]: value };
                      return { ...f, instructions };
                    });
                  }}
                  onRemove={() => {
                    setForm((f) => ({
                      ...f,
                      instructions: f.instructions.filter(
                        (_, idx) => idx !== i,
                      ),
                    }));
                  }}
                />
              ))}
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_TAGS.map((tag) => (
              <Badge
                key={tag}
                variant={form.tags.includes(tag) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Custom tag"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && (e.preventDefault(), addCustomTag())
              }
            />
            <Button variant="outline" onClick={addCustomTag}>
              Add
            </Button>
          </div>
          {form.tags.filter(
            (t) =>
              !SUGGESTED_TAGS.includes(t as (typeof SUGGESTED_TAGS)[number]),
          ).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.tags
                .filter(
                  (t) =>
                    !SUGGESTED_TAGS.includes(
                      t as (typeof SUGGESTED_TAGS)[number],
                    ),
                )
                .map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sharing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Keep Private</Label>
              <p className="text-sm text-fg-secondary">
                Only you can see this recipe
              </p>
            </div>
            <Switch
              checked={form.is_private}
              onCheckedChange={(checked) =>
                setForm((f) => ({
                  ...f,
                  is_private: checked,
                  group_ids: checked ? [] : f.group_ids,
                }))
              }
            />
          </div>
          {!form.is_private && groups.length > 0 && (
            <div className="space-y-2">
              <Label>Share with groups</Label>
              {groups.map((g) => (
                <label
                  key={g.id}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={form.group_ids.includes(g.id)}
                    onChange={(e) => {
                      setForm((f) => ({
                        ...f,
                        group_ids: e.target.checked
                          ? [...f.group_ids, g.id]
                          : f.group_ids.filter((id) => id !== g.id),
                      }));
                    }}
                    className="rounded"
                  />
                  <span>{g.name}</span>
                </label>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3 sticky bottom-mobile-actions lg:bottom-4 bg-page/95 backdrop-blur p-4 rounded-2xl border border-border">
        <Button
          size="lg"
          onClick={() => handleSubmit(false)}
          disabled={saving}
          className="flex-1"
        >
          {saving ? "Saving..." : recipe ? "Update Recipe" : "Publish Recipe"}
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => handleSubmit(true)}
          disabled={saving}
        >
          Save Draft
        </Button>
      </div>
    </div>
  );
}
