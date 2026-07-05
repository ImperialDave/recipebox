import { formatQuantity, roundForCount } from "./format";
import { parseQuantity } from "./parse";
import { COUNT_UNITS } from "./constants";
import type { ParsedQuantity, ScaleIngredientOptions } from "./types";

export function getScaleRatio(
  baseServings: number,
  targetServings: number,
): number {
  if (baseServings <= 0 || targetServings <= 0) return 1;
  return targetServings / baseServings;
}

export function scaleAmount(value: number, ratio: number): number {
  return value * ratio;
}

function isCountIngredient(options?: ScaleIngredientOptions): boolean {
  const unit = options?.unit?.trim().toLowerCase() || "";
  if (COUNT_UNITS.has(unit)) return true;

  const name = options?.ingredientName?.toLowerCase() || "";
  return /\begg(s)?\b/.test(name);
}

function formatScaledValue(value: number, options?: ScaleIngredientOptions): string {
  const finalValue = isCountIngredient(options) ? roundForCount(value) : value;
  return formatQuantity(finalValue);
}

function scaleParsedQuantity(
  parsed: ParsedQuantity,
  ratio: number,
  options?: ScaleIngredientOptions,
): string {
  switch (parsed.kind) {
    case "empty":
      return "";
    case "text":
      return parsed.raw;
    case "amount":
      if (ratio === 1) {
        return formatScaledValue(parsed.value, options);
      }
      return formatScaledValue(scaleAmount(parsed.value, ratio), options);
    case "range": {
      const min = formatScaledValue(scaleAmount(parsed.min, ratio), options);
      const max = formatScaledValue(scaleAmount(parsed.max, ratio), options);
      return `${min}-${max}`;
    }
    default:
      return "";
  }
}

export function scaleIngredientQuantity(
  quantity: string,
  ratio: number,
  options?: ScaleIngredientOptions,
): string {
  if (!quantity.trim() || ratio === 1) {
    const parsed = parseQuantity(quantity);
    if (parsed.kind === "amount") {
      return formatScaledValue(parsed.value, options);
    }
    if (parsed.kind === "range") {
      return `${formatScaledValue(parsed.min, options)}-${formatScaledValue(parsed.max, options)}`;
    }
    return quantity;
  }

  return scaleParsedQuantity(parseQuantity(quantity), ratio, options);
}

export function getScaleDescription(
  baseServings: number,
  targetServings: number,
): string | null {
  if (baseServings <= 0 || targetServings === baseServings) return null;
  if (targetServings === baseServings * 2) return "Doubled";
  if (targetServings * 2 === baseServings) return "Halved";
  const ratio = getScaleRatio(baseServings, targetServings);
  const rounded =
    ratio >= 1
      ? ratio.toFixed(2).replace(/\.?0+$/, "")
      : ratio.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  return `×${rounded}`;
}