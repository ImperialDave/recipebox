"use client";

import { useEffect } from "react";
import { PrintView } from "@/components/recipes/print-view";
import type { Recipe } from "@/lib/types";

interface PrintBatchClientProps {
  recipes: Recipe[];
}

export function PrintBatchClient({ recipes }: PrintBatchClientProps) {
  useEffect(() => {
    if (recipes.length > 0) {
      setTimeout(() => window.print(), 500);
    }
  }, [recipes]);

  if (recipes.length === 0) {
    return <p className="p-8 text-center">No recipes selected for printing.</p>;
  }

  return (
    <div>
      {recipes.map((recipe, i) => (
        <div key={recipe.id} style={{ pageBreakAfter: i < recipes.length - 1 ? "always" : "auto" }}>
          <PrintView recipe={recipe} />
        </div>
      ))}
    </div>
  );
}