import { ZipArchive } from "archiver";
import { PassThrough, Readable } from "stream";
import { renderIndexHtml, renderRecipeHtml } from "./recipe-print-html";
import { buildRecipeFilenames } from "./filenames";
import { fetchImageBuffer } from "./fetch-image";
import { APP_NAME } from "@/lib/constants";
import type { Recipe } from "@/lib/types";

export interface BackupOptions {
  includePhotos: boolean;
}

export function buildRecipeZipStream(
  recipes: Recipe[],
  options: BackupOptions,
): ReadableStream<Uint8Array> {
  const passThrough = new PassThrough();
  const archive = new ZipArchive({ zlib: { level: 6 } });

  archive.on("error", (err) => passThrough.destroy(err));
  archive.pipe(passThrough);

  void (async () => {
    try {
      const filenames = buildRecipeFilenames(recipes);
      const indexEntries: {
        title: string;
        filename: string;
        category: string;
      }[] = [];
      const manifestRecipes: {
        id: string;
        title: string;
        filename: string;
        category: string;
        exported_at: string;
      }[] = [];

      const exportedAt = new Date().toISOString();

      for (const recipe of recipes) {
        const filename = filenames.get(recipe.id)!;
        let imagePath: string | undefined;

        if (options.includePhotos && recipe.hero_url) {
          const image = await fetchImageBuffer(recipe.hero_url);
          if (image) {
            const imageName = `images/${filename}.${image.ext}`;
            archive.append(image.buffer, { name: imageName });
            imagePath = `../${imageName}`;
          }
        }

        const html = renderRecipeHtml(recipe, { imagePath });
        archive.append(html, { name: `recipes/${filename}.html` });

        indexEntries.push({
          title: recipe.title,
          filename,
          category: recipe.category,
        });

        manifestRecipes.push({
          id: recipe.id,
          title: recipe.title,
          filename,
          category: recipe.category,
          exported_at: exportedAt,
        });
      }

      archive.append(renderIndexHtml(indexEntries), { name: "index.html" });

      archive.append(
        JSON.stringify(
          {
            exported_at: exportedAt,
            app: APP_NAME,
            recipe_count: recipes.length,
            include_photos: options.includePhotos,
            recipes: manifestRecipes,
          },
          null,
          2,
        ),
        { name: "manifest.json" },
      );

      await archive.finalize();
    } catch (err) {
      archive.abort();
      passThrough.destroy(err instanceof Error ? err : new Error(String(err)));
    }
  })();

  return Readable.toWeb(passThrough) as ReadableStream<Uint8Array>;
}
