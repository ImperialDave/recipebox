import { format } from "date-fns";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { formatMinutes, getDisplayName } from "@/lib/utils";
import type { Recipe } from "@/lib/types";

const PRINT_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Georgia, "Times New Roman", serif;
    background: white;
    color: #1a1a1a;
    font-size: 14pt;
    line-height: 1.7;
    padding: 0.75in;
    max-width: 8.5in;
    margin: 0 auto;
  }
  header { margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 2px solid #000; }
  .app-name { font-size: 10pt; color: #666; margin-bottom: 0.25rem; }
  .group-name { font-size: 10pt; color: #666; margin-bottom: 0.5rem; }
  .printed-date { font-size: 9pt; color: #888; }
  h1 { font-size: 28pt; font-weight: bold; margin-bottom: 1rem; }
  h2 { font-size: 18pt; font-weight: bold; margin-top: 1.5rem; margin-bottom: 0.75rem; }
  .meta { display: flex; flex-wrap: wrap; gap: 1.5rem; margin-bottom: 1.5rem; font-size: 11pt; }
  .hero-image { width: 100%; max-height: 300px; object-fit: cover; margin-bottom: 1.5rem; }
  .description { font-style: italic; color: #444; margin-bottom: 1.5rem; line-height: 1.6; }
  .ingredients { columns: 2; column-gap: 2em; list-style: none; margin-bottom: 2rem; }
  .ingredients li { margin-bottom: 0.25rem; break-inside: avoid; }
  .instructions { margin-bottom: 2rem; padding-left: 1.25rem; }
  .instructions li { margin-bottom: 1rem; line-height: 1.7; }
  .timer { color: #666; font-size: 10pt; margin-left: 0.5rem; }
  .tags { font-size: 11pt; color: #555; margin-bottom: 1.5rem; }
  .notes-area {
    border: 1px dashed #ccc;
    min-height: 2in;
    margin-top: 1.5rem;
    padding: 0.5in;
  }
  .notes-label { font-size: 10pt; color: #888; margin-bottom: 0.5rem; }
  footer {
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid #ddd;
    font-size: 9pt;
    color: #888;
    text-align: center;
  }
  @media print {
    body { padding: 0.5in; }
    .hero-image { max-height: 250px; }
  }
`;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderRecipeHtml(
  recipe: Recipe,
  options?: { groupName?: string; imagePath?: string },
): string {
  const printedDate = format(new Date(), "MMMM d, yyyy");
  const groupName = options?.groupName;
  const imagePath = options?.imagePath;

  const metaParts: string[] = [];
  if (recipe.prep_time_minutes) {
    metaParts.push(
      `<span><strong>Prep:</strong> ${escapeHtml(formatMinutes(recipe.prep_time_minutes))}</span>`,
    );
  }
  if (recipe.cook_time_minutes) {
    metaParts.push(
      `<span><strong>Cook:</strong> ${escapeHtml(formatMinutes(recipe.cook_time_minutes))}</span>`,
    );
  }
  if (recipe.total_time_minutes) {
    metaParts.push(
      `<span><strong>Total:</strong> ${escapeHtml(formatMinutes(recipe.total_time_minutes))}</span>`,
    );
  }
  if (recipe.servings) {
    metaParts.push(
      `<span><strong>Servings:</strong> ${recipe.servings}</span>`,
    );
  }

  const ingredients = (recipe.ingredients || [])
    .map((ing) => {
      const qty = ing.quantity ? `${escapeHtml(ing.quantity)} ` : "";
      const unit = ing.unit ? `${escapeHtml(ing.unit)} ` : "";
      const name = escapeHtml(ing.name);
      const note = ing.prep_note ? `, ${escapeHtml(ing.prep_note)}` : "";
      return `<li>${qty}${unit}<strong>${name}</strong>${note}</li>`;
    })
    .join("\n");

  const instructions = (recipe.instructions || [])
    .map((inst) => {
      const timer = inst.timer_minutes
        ? `<span class="timer">(${inst.timer_minutes} min)</span>`
        : "";
      return `<li>${escapeHtml(inst.text)}${timer}</li>`;
    })
    .join("\n");

  const tags =
    recipe.tags.length > 0
      ? `<div class="tags"><strong>Tags:</strong> ${recipe.tags.map(escapeHtml).join(", ")}</div>`
      : "";

  const image = imagePath
    ? `<img class="hero-image" src="${escapeHtml(imagePath)}" alt="${escapeHtml(recipe.title)}" />`
    : "";

  const description = recipe.description
    ? `<div class="description">${escapeHtml(recipe.description)}</div>`
    : "";

  const creatorName = escapeHtml(getDisplayName(recipe.owner));
  const createdDate = escapeHtml(
    format(new Date(recipe.created_at), "MMMM d, yyyy"),
  );
  const attribution = `<p class="description">Added by ${creatorName} · ${createdDate}</p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(recipe.title)} — ${APP_NAME}</title>
  <style>${PRINT_CSS}</style>
</head>
<body>
  <header>
    <div class="app-name">${escapeHtml(APP_NAME)}</div>
    ${groupName ? `<div class="group-name">${escapeHtml(groupName)}</div>` : ""}
    <div class="printed-date">Exported ${printedDate}</div>
  </header>

  <h1>${escapeHtml(recipe.title)}</h1>
  ${attribution}

  ${metaParts.length > 0 ? `<div class="meta">${metaParts.join("")}</div>` : ""}
  ${image}
  ${description}

  <h2>Ingredients</h2>
  <ul class="ingredients">
    ${ingredients || "<li><em>No ingredients listed</em></li>"}
  </ul>

  <h2>Instructions</h2>
  <ol class="instructions">
    ${instructions || "<li><em>No instructions listed</em></li>"}
  </ol>

  ${tags}

  <div class="notes-area">
    <p class="notes-label">Notes:</p>
  </div>

  <footer>
    Exported from ${escapeHtml(APP_NAME)} • ${escapeHtml(APP_TAGLINE)}
  </footer>
</body>
</html>`;
}

export function renderIndexHtml(
  recipes: { title: string; filename: string; category: string }[],
): string {
  const sorted = [...recipes].sort(
    (a, b) =>
      a.category.localeCompare(b.category) || a.title.localeCompare(b.title),
  );

  const byCategory = sorted.reduce<Record<string, typeof sorted>>((acc, r) => {
    (acc[r.category] ??= []).push(r);
    return acc;
  }, {});

  const sections = Object.entries(byCategory)
    .map(([category, items]) => {
      const links = items
        .map(
          (r) =>
            `<li><a href="recipes/${escapeHtml(r.filename)}.html">${escapeHtml(r.title)}</a></li>`,
        )
        .join("\n");
      return `<section><h2>${escapeHtml(category)}</h2><ul>${links}</ul></section>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Recipe Backup — ${APP_NAME}</title>
  <style>
    body { font-family: Georgia, serif; max-width: 800px; margin: 2rem auto; padding: 0 1.5rem; line-height: 1.6; }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    .subtitle { color: #666; margin-bottom: 2rem; }
    h2 { font-size: 1.25rem; margin-top: 1.5rem; margin-bottom: 0.5rem; border-bottom: 1px solid #ddd; padding-bottom: 0.25rem; }
    ul { list-style: none; padding: 0; }
    li { margin: 0.35rem 0; }
    a { color: #4a6741; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>${escapeHtml(APP_NAME)}</h1>
  <p class="subtitle">${recipes.length} recipe${recipes.length === 1 ? "" : "s"} — exported ${format(new Date(), "MMMM d, yyyy")}</p>
  <p>Open any recipe below to view and print. Use your browser's Print function (Ctrl+P / Cmd+P) to save as PDF.</p>
  ${sections}
</body>
</html>`;
}
