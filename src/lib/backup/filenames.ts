import { slugify } from "@/lib/utils";
import type { Recipe } from "@/lib/types";

export function buildRecipeFilenames(recipes: Recipe[]): Map<string, string> {
  const used = new Set<string>();
  const map = new Map<string, string>();

  for (const recipe of recipes) {
    let base = slugify(recipe.title) || recipe.id.slice(0, 8);
    if (!base) base = recipe.id.slice(0, 8);

    let name = base;
    let counter = 2;
    while (used.has(name)) {
      name = `${base}-${counter++}`;
    }

    used.add(name);
    map.set(recipe.id, name);
  }

  return map;
}

export function backupZipFilename(): string {
  const date = new Date().toISOString().slice(0, 10);
  return `recipevault-backup-${date}.zip`;
}
