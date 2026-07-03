"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, CheckCheck, Plus, Calendar, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  toggleShoppingItem,
  clearCheckedShoppingItems,
  deleteShoppingItem,
  addShoppingItem,
} from "@/lib/actions/meal-planner";
import { SHOPPING_CATEGORIES } from "@/lib/constants";
import type { ShoppingListItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ShoppingListClientProps {
  initialItems: ShoppingListItem[];
}

function sortItems(items: ShoppingListItem[]) {
  return [...items].sort((a, b) => {
    const byCategory = a.category.localeCompare(b.category);
    if (byCategory !== 0) return byCategory;
    return a.ingredient_name.localeCompare(b.ingredient_name);
  });
}

function groupItems(items: ShoppingListItem[]) {
  const grouped = items.reduce<Record<string, ShoppingListItem[]>>((acc, item) => {
    const cat = item.category || "Other";
    (acc[cat] ??= []).push(item);
    return acc;
  }, {});

  return Object.entries(grouped).sort(([a], [b]) => {
    const aIndex = SHOPPING_CATEGORIES.indexOf(a as (typeof SHOPPING_CATEGORIES)[number]);
    const bIndex = SHOPPING_CATEGORIES.indexOf(b as (typeof SHOPPING_CATEGORIES)[number]);
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
}

export function ShoppingListClient({ initialItems }: ShoppingListClientProps) {
  const router = useRouter();
  const [items, setItems] = useState(() => sortItems(initialItems));
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState<string>("Other");
  const [adding, setAdding] = useState(false);

  const grouped = groupItems(items);
  const checkedCount = items.filter((i) => i.checked).length;
  const uncheckedCount = items.length - checkedCount;

  const handleToggle = async (id: string, checked: boolean) => {
    const previous = items;
    setItems(items.map((i) => (i.id === id ? { ...i, checked } : i)));
    try {
      await toggleShoppingItem(id, checked);
      router.refresh();
    } catch {
      setItems(previous);
      toast.error("Could not update item");
    }
  };

  const handleDelete = async (id: string) => {
    const previous = items;
    setItems(items.filter((i) => i.id !== id));
    try {
      await deleteShoppingItem(id);
      toast.success("Item removed");
      router.refresh();
    } catch {
      setItems(previous);
      toast.error("Could not remove item");
    }
  };

  const handleClearChecked = async () => {
    const previous = items;
    setItems(items.filter((i) => !i.checked));
    try {
      await clearCheckedShoppingItems();
      toast.success("Cleared checked items");
      router.refresh();
    } catch {
      setItems(previous);
      toast.error("Could not clear checked items");
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setAdding(true);
    try {
      const newItem = await addShoppingItem({
        ingredient_name: name,
        quantity,
        unit,
        category,
      });
      setItems((prev) => sortItems([...prev, newItem]));
      setName("");
      setQuantity("");
      setUnit("");
      toast.success("Added to shopping list");
      router.refresh();
    } catch {
      toast.error("Could not add item");
    } finally {
      setAdding(false);
    }
  };

  return (
    <>
      <AppHeader />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="font-serif text-3xl font-bold text-brown-800">Shopping List</h1>
              <p className="text-brown-500 mt-1">
                {items.length === 0
                  ? "Nothing on your list yet"
                  : `${uncheckedCount} to buy${checkedCount > 0 ? `, ${checkedCount} in cart` : ""}`}
              </p>
            </div>
            {checkedCount > 0 && (
              <Button variant="outline" onClick={handleClearChecked} className="shrink-0">
                <CheckCheck className="h-4 w-4 mr-1" />
                Clear checked
              </Button>
            )}
          </div>

          <Card className="mb-8">
            <CardContent className="pt-6">
              <form onSubmit={handleAddItem} className="space-y-4">
                <div>
                  <Label htmlFor="item-name">Add an item</Label>
                  <Input
                    id="item-name"
                    placeholder="e.g. Milk, eggs, olive oil..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="item-qty">Qty</Label>
                    <Input
                      id="item-qty"
                      placeholder="2"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="item-unit">Unit</Label>
                    <Input
                      id="item-unit"
                      placeholder="cups"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <Label>Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SHOPPING_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" disabled={adding || !name.trim()} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-1" />
                  {adding ? "Adding..." : "Add to list"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {items.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🛒</div>
              <h2 className="font-serif text-2xl font-semibold text-brown-800 mb-2">
                Your list is empty
              </h2>
              <p className="text-brown-500 mb-6 max-w-sm mx-auto">
                Add items above, pull ingredients from a recipe, or generate a list from your meal
                planner.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/recipes">
                  <Button variant="outline">
                    <BookOpen className="h-4 w-4 mr-1" />
                    Browse Recipes
                  </Button>
                </Link>
                <Link href="/meal-planner">
                  <Button variant="outline">
                    <Calendar className="h-4 w-4 mr-1" />
                    Meal Planner
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {grouped.map(([cat, categoryItems]) => (
                <section key={cat}>
                  <h2 className="font-serif text-lg font-semibold text-brown-700 mb-3">
                    {cat}
                    <span className="ml-2 text-sm font-normal text-brown-400">
                      ({categoryItems.filter((i) => !i.checked).length})
                    </span>
                  </h2>
                  <ul className="space-y-2">
                    {categoryItems.map((item) => (
                      <li
                        key={item.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border transition-colors",
                          item.checked
                            ? "bg-cream-200/50 border-cream-300 opacity-75"
                            : "bg-cream-50 border-cream-300"
                        )}
                      >
                        <Checkbox
                          checked={item.checked}
                          onCheckedChange={(checked) => {
                            if (typeof checked === "boolean") {
                              handleToggle(item.id, checked);
                            }
                          }}
                          aria-label={`Mark ${item.ingredient_name} as ${item.checked ? "needed" : "got"}`}
                        />
                        <span
                          className={cn(
                            "flex-1 text-base sm:text-lg text-brown-800",
                            item.checked && "line-through text-brown-400"
                          )}
                        >
                          {(item.quantity || item.unit) && (
                            <span className="font-medium">
                              {item.quantity}
                              {item.quantity && item.unit ? " " : ""}
                              {item.unit}
                              {" — "}
                            </span>
                          )}
                          {item.ingredient_name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="text-brown-400 hover:text-red-500 dark:hover:text-red-400 p-1 rounded-lg hover:bg-cream-200 transition-colors"
                          aria-label={`Remove ${item.ingredient_name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}