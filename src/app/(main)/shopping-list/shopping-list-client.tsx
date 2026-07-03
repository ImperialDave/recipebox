"use client";

import { useState } from "react";
import { Trash2, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AppHeader } from "@/components/layout/app-header";
import {
  toggleShoppingItem,
  clearCheckedShoppingItems,
  deleteShoppingItem,
} from "@/lib/actions/meal-planner";
import type { ShoppingListItem } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ShoppingListClientProps {
  initialItems: ShoppingListItem[];
}

export function ShoppingListClient({ initialItems }: ShoppingListClientProps) {
  const [items, setItems] = useState(initialItems);

  const grouped = items.reduce<Record<string, ShoppingListItem[]>>((acc, item) => {
    const cat = item.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const handleToggle = async (id: string, checked: boolean) => {
    setItems(items.map((i) => (i.id === id ? { ...i, checked } : i)));
    await toggleShoppingItem(id, checked);
  };

  const handleDelete = async (id: string) => {
    setItems(items.filter((i) => i.id !== id));
    await deleteShoppingItem(id);
  };

  const handleClearChecked = async () => {
    setItems(items.filter((i) => !i.checked));
    await clearCheckedShoppingItems();
  };

  const checkedCount = items.filter((i) => i.checked).length;

  return (
    <>
      <AppHeader />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-serif text-3xl font-bold text-brown-800">Shopping List</h1>
              <p className="text-brown-500 mt-1">
                {items.length} items{checkedCount > 0 && `, ${checkedCount} checked off`}
              </p>
            </div>
            {checkedCount > 0 && (
              <Button variant="outline" onClick={handleClearChecked}>
                <CheckCheck className="h-4 w-4 mr-1" />
                Clear checked
              </Button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🛒</div>
              <h2 className="font-serif text-2xl font-semibold text-brown-800 mb-2">
                List is empty
              </h2>
              <p className="text-brown-500">
                Add missing ingredients from recipes or generate from your meal plan
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([category, categoryItems]) => (
                <section key={category}>
                  <h2 className="font-serif text-lg font-semibold text-brown-700 mb-3 capitalize">
                    {category}
                  </h2>
                  <ul className="space-y-2">
                    {categoryItems.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white border border-cream-300"
                      >
                        <Checkbox
                          checked={item.checked}
                          onCheckedChange={(checked) =>
                            handleToggle(item.id, checked as boolean)
                          }
                        />
                        <span
                          className={cn(
                            "flex-1 text-lg",
                            item.checked && "line-through text-brown-400"
                          )}
                        >
                          {item.quantity && `${item.quantity} `}
                          {item.unit && `${item.unit} `}
                          {item.ingredient_name}
                        </span>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-brown-400 hover:text-red-500 p-1"
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