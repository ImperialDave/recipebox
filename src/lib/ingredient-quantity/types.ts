export type ParsedQuantity =
  | { kind: "amount"; value: number }
  | { kind: "range"; min: number; max: number }
  | { kind: "text"; raw: string }
  | { kind: "empty" };

export interface ScaleIngredientOptions {
  unit?: string;
  ingredientName?: string;
}