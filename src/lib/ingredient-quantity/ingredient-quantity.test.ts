import { describe, expect, it } from "vitest";
import { parseQuantity } from "./parse";
import { formatQuantity } from "./format";
import {
  getScaleRatio,
  scaleIngredientQuantity,
} from "./scale";

describe("parseQuantity", () => {
  it("parses whole numbers", () => {
    expect(parseQuantity("2")).toEqual({ kind: "amount", value: 2 });
  });

  it("parses simple fractions", () => {
    expect(parseQuantity("1/2")).toEqual({ kind: "amount", value: 0.5 });
    expect(parseQuantity("3/4")).toEqual({ kind: "amount", value: 0.75 });
  });

  it("parses mixed numbers", () => {
    expect(parseQuantity("1 3/4")).toEqual({ kind: "amount", value: 1.75 });
    expect(parseQuantity("2 1/4")).toEqual({ kind: "amount", value: 2.25 });
  });

  it("parses unicode fractions", () => {
    expect(parseQuantity("½")).toEqual({ kind: "amount", value: 0.5 });
    expect(parseQuantity("1½")).toEqual({ kind: "amount", value: 1.5 });
  });

  it("parses ranges", () => {
    expect(parseQuantity("1-2")).toEqual({ kind: "range", min: 1, max: 2 });
  });

  it("keeps non-scalable text", () => {
    expect(parseQuantity("to taste")).toEqual({
      kind: "text",
      raw: "to taste",
    });
  });
});

describe("formatQuantity", () => {
  it("formats common cooking fractions", () => {
    expect(formatQuantity(1.75)).toBe("1 3/4");
    expect(formatQuantity(0.333333)).toBe("1/3");
    expect(formatQuantity(2)).toBe("2");
  });
});

describe("scaleIngredientQuantity", () => {
  const ratio2 = getScaleRatio(4, 8);

  it("scales mixed numbers at 2x", () => {
    expect(ratio2).toBe(2);
    expect(scaleIngredientQuantity("1/2", ratio2)).toBe("1");
    expect(scaleIngredientQuantity("1 3/4", ratio2)).toBe("3 1/2");
    expect(scaleIngredientQuantity("2 1/4", ratio2)).toBe("4 1/2");
  });

  it("scales down accurately", () => {
    const ratioHalf = getScaleRatio(8, 4);
    expect(scaleIngredientQuantity("3", ratioHalf)).toBe("1 1/2");
  });

  it("leaves text unchanged", () => {
    expect(scaleIngredientQuantity("to taste", 2)).toBe("to taste");
  });

  it("scales ranges", () => {
    expect(scaleIngredientQuantity("1-2", 2)).toBe("2-4");
  });

  it("rounds count ingredients to nearest half", () => {
    const ratio = getScaleRatio(4, 5);
    expect(
      scaleIngredientQuantity("2", ratio, { unit: "eggs" }),
    ).toBe("2 1/2");
    expect(
      scaleIngredientQuantity("3", ratio, { ingredientName: "large eggs" }),
    ).toBe("4");
  });
});