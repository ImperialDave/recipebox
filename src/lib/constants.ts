export const APP_NAME = "The Family Recipe Box";
export const APP_TAGLINE = "Family traditions, one recipe at a time";

export const DEFAULT_CATEGORIES = [
  "Breakfast & Brunch",
  "Lunch",
  "Dinner",
  "Desserts",
  "Appetizers & Snacks",
  "Sides & Salads",
  "Soups & Stews",
  "Breads & Baked Goods",
  "Beverages",
  "Kid-Friendly Favorites",
  "Holiday & Special Occasions",
] as const;

export const SUGGESTED_TAGS = [
  "Quick & Easy",
  "Kid-Friendly",
  "Vegetarian",
  "Gluten-Free",
  "Comfort Food",
  "One-Pot",
  "Make-Ahead",
  "Holiday",
  "Dairy-Free",
  "Nut-Free",
  "Vegan",
  "Low-Carb",
  "Freezer-Friendly",
  "Budget-Friendly",
] as const;

export const UNITS = [
  "cup",
  "cups",
  "tbsp",
  "tsp",
  "oz",
  "lb",
  "g",
  "kg",
  "ml",
  "L",
  "pinch",
  "dash",
  "clove",
  "slice",
  "piece",
  "can",
  "package",
  "bunch",
  "head",
  "stick",
  "",
] as const;

export const TIME_RANGES = [
  { label: "Under 30 min", min: 0, max: 30 },
  { label: "30–60 min", min: 30, max: 60 },
  { label: "1–2 hours", min: 60, max: 120 },
  { label: "Over 2 hours", min: 120, max: 9999 },
] as const;

export const GROUP_ROLES = ["admin", "editor", "viewer"] as const;
export type GroupRole = (typeof GROUP_ROLES)[number];

export const ROLE_LABELS: Record<GroupRole, string> = {
  admin: "Admin",
  editor: "Editor",
  viewer: "Viewer",
};

export const ROLE_DESCRIPTIONS: Record<GroupRole, string> = {
  admin: "Full control — manage members, delete recipes, group settings",
  editor: "Add, edit, and delete recipes shared to the group",
  viewer: "View, print, favorite, and leave comments only",
};

export const DIFFICULTY_LEVELS = ["Easy", "Medium", "Hard"] as const;