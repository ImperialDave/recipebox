"use client";

import { useState } from "react";
import { ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecipeForm } from "@/components/recipes/recipe-form";
import { RecipeScanFlow } from "@/components/recipes/recipe-scan-flow";
import type { RecipeFormData } from "@/lib/types";

interface NewRecipeClientProps {
  groups: { id: string; name: string }[];
}

export function NewRecipeClient({ groups }: NewRecipeClientProps) {
  const [scanOpen, setScanOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [initialForm, setInitialForm] = useState<
    Partial<RecipeFormData> | undefined
  >();

  const handleScanApply = (data: Partial<RecipeFormData>) => {
    setInitialForm(data);
    setFormKey((key) => key + 1);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="font-serif text-3xl font-bold text-fg">Add New Recipe</h1>
        <Button variant="outline" onClick={() => setScanOpen(true)}>
          <ScanLine className="h-4 w-4 mr-2" />
          Scan from photo
        </Button>
      </div>

      <RecipeForm
        key={formKey}
        groups={groups}
        initialForm={initialForm}
      />

      <RecipeScanFlow
        open={scanOpen}
        onOpenChange={setScanOpen}
        onApply={handleScanApply}
      />
    </>
  );
}