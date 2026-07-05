import {
  FRACTION_TOLERANCE,
  KITCHEN_DENOMINATORS,
} from "./constants";

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const temp = y;
    y = x % y;
    x = temp;
  }
  return x;
}

function formatFractionPart(value: number): string | null {
  if (value < FRACTION_TOLERANCE) return null;

  let bestNumerator = 0;
  let bestDenominator = 1;
  let bestError = Number.POSITIVE_INFINITY;

  for (const denominator of KITCHEN_DENOMINATORS) {
    const numerator = Math.round(value * denominator);
    const error = Math.abs(value - numerator / denominator);
    if (error < bestError) {
      bestError = error;
      bestNumerator = numerator;
      bestDenominator = denominator;
    }
  }

  if (bestError > FRACTION_TOLERANCE) return null;

  const divisor = gcd(bestNumerator, bestDenominator);
  const numerator = bestNumerator / divisor;
  const denominator = bestDenominator / divisor;

  if (numerator === 0) return null;
  if (numerator === denominator) return null;
  return `${numerator}/${denominator}`;
}

export function formatQuantity(value: number): string {
  if (!Number.isFinite(value) || value < 0) return String(value);

  const whole = Math.floor(value + FRACTION_TOLERANCE);
  const fraction = value - whole;
  const fractionText = formatFractionPart(fraction);

  if (whole === 0 && fractionText) return fractionText;
  if (!fractionText) return String(whole);
  return `${whole} ${fractionText}`;
}

export function roundForCount(value: number): number {
  return Math.round(value * 2) / 2;
}