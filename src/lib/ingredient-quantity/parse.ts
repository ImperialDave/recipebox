import { NON_SCALABLE_PATTERNS, UNICODE_FRACTIONS } from "./constants";
import type { ParsedQuantity } from "./types";

function normalizeUnicodeFractions(input: string): string {
  let result = input.trim();
  for (const [unicode, ascii] of Object.entries(UNICODE_FRACTIONS)) {
    result = result.replaceAll(unicode, ` ${ascii} `);
  }
  return result.replace(/\s+/g, " ").trim();
}

function parseAmountToken(token: string): number | null {
  const cleaned = token.trim();
  if (!cleaned) return null;

  const mixedMatch = cleaned.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const whole = Number(mixedMatch[1]);
    const num = Number(mixedMatch[2]);
    const den = Number(mixedMatch[3]);
    if (den === 0) return null;
    return whole + num / den;
  }

  const fractionMatch = cleaned.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const num = Number(fractionMatch[1]);
    const den = Number(fractionMatch[2]);
    if (den === 0) return null;
    return num / den;
  }

  const decimal = Number.parseFloat(cleaned);
  if (Number.isFinite(decimal)) return decimal;

  return null;
}

function parseRange(input: string): ParsedQuantity | null {
  const rangeMatch = input.match(/^(.+?)\s*[-–]\s*(.+)$/);
  if (!rangeMatch) return null;

  const min = parseAmountToken(rangeMatch[1]);
  const max = parseAmountToken(rangeMatch[2]);
  if (min === null || max === null) return null;

  return { kind: "range", min, max };
}

export function parseQuantity(input: string): ParsedQuantity {
  const trimmed = input.trim();
  if (!trimmed) return { kind: "empty" };

  if (NON_SCALABLE_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return { kind: "text", raw: trimmed };
  }

  const normalized = normalizeUnicodeFractions(trimmed);

  const range = parseRange(normalized);
  if (range) return range;

  const value = parseAmountToken(normalized);
  if (value !== null) return { kind: "amount", value };

  return { kind: "text", raw: trimmed };
}