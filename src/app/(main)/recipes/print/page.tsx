import { PrintBatchClient } from "./print-batch-client";
import { getRecipe } from "@/lib/queries";

interface Props {
  searchParams: Promise<{ ids?: string }>;
}

export default async function PrintBatchPage({ searchParams }: Props) {
  const { ids } = await searchParams;
  const recipeIds = ids?.split(",").filter(Boolean) || [];

  const recipes = await Promise.all(
    recipeIds.map((id) => getRecipe(id))
  );

  const validRecipes = recipes.filter((r): r is NonNullable<typeof r> => r !== null);

  return <PrintBatchClient recipes={validRecipes} />;
}