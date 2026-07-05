export const KITCHEN_DENOMINATORS = [2, 3, 4, 8] as const;

export const FRACTION_TOLERANCE = 1 / 16;

export const COUNT_UNITS = new Set([
  "",
  "piece",
  "pieces",
  "egg",
  "eggs",
  "clove",
  "cloves",
  "slice",
  "slices",
  "can",
  "cans",
  "package",
  "packages",
  "bunch",
  "bunches",
  "head",
  "heads",
  "stick",
  "sticks",
]);

export const NON_SCALABLE_PATTERNS = [
  /^to taste$/i,
  /^as needed$/i,
  /^as desired$/i,
  /^optional$/i,
  /^pinch$/i,
  /^dash$/i,
  /^a pinch$/i,
  /^a dash$/i,
];

export const UNICODE_FRACTIONS: Record<string, string> = {
  "¼": "1/4",
  "½": "1/2",
  "¾": "3/4",
  "⅓": "1/3",
  "⅔": "2/3",
  "⅛": "1/8",
  "⅜": "3/8",
  "⅝": "5/8",
  "⅞": "7/8",
};