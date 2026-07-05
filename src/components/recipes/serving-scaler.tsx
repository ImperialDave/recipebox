"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getScaleDescription } from "@/lib/ingredient-quantity";

interface ServingScalerProps {
  baseServings: number;
  targetServings: number;
  onChange: (servings: number) => void;
}

export function ServingScaler({
  baseServings,
  targetServings,
  onChange,
}: ServingScalerProps) {
  const scaleHint = getScaleDescription(baseServings, targetServings);

  const adjust = (delta: number) => {
    onChange(Math.max(1, Math.min(99, targetServings + delta)));
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-fg-secondary whitespace-nowrap">Servings</span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => adjust(-1)}
          disabled={targetServings <= 1}
          aria-label="Decrease servings"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Input
          type="number"
          min={1}
          max={99}
          value={targetServings}
          onChange={(event) => {
            const next = Number.parseInt(event.target.value, 10);
            if (Number.isFinite(next) && next >= 1 && next <= 99) {
              onChange(next);
            }
          }}
          className="h-8 w-16 text-center px-2"
          aria-label="Target servings"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => adjust(1)}
          disabled={targetServings >= 99}
          aria-label="Increase servings"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center gap-2 text-xs text-fg-muted">
        <span>Recipe: {baseServings}</span>
        {scaleHint && (
          <span className="rounded-full bg-accent-subtle px-2 py-0.5 text-accent">
            {scaleHint}
          </span>
        )}
      </div>
      <div className="flex gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() =>
            onChange(Math.max(1, Math.round(baseServings / 2)))
          }
        >
          Half
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => onChange(baseServings)}
        >
          Original
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => onChange(Math.min(99, baseServings * 2))}
        >
          Double
        </Button>
      </div>
    </div>
  );
}