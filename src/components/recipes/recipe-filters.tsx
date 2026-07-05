"use client";

import {
  FOOD_CATEGORIES,
  SUGGESTED_TAGS,
  TIME_RANGES,
  UTILITY_CATEGORIES,
} from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { X, LayoutGrid, List } from "lucide-react";

interface RecipeFiltersProps {
  category: string;
  onCategoryChange: (category: string) => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
  sort: string;
  onSortChange: (sort: string) => void;
  view: "grid" | "list";
  onViewChange: (view: "grid" | "list") => void;
}

export function RecipeFilters({
  category,
  onCategoryChange,
  selectedTags,
  onTagsChange,
  timeRange,
  onTimeRangeChange,
  sort,
  onSortChange,
  view,
  onViewChange,
}: RecipeFiltersProps) {
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter((t) => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const hasFilters = category || selectedTags.length > 0 || timeRange;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={sort} onValueChange={onSortChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="title">A–Z</SelectItem>
            <SelectItem value="time">Shortest time</SelectItem>
          </SelectContent>
        </Select>

        <Select value={timeRange} onValueChange={onTimeRangeChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any time</SelectItem>
            {TIME_RANGES.map((range) => (
              <SelectItem key={range.label} value={range.label}>
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-1 ml-auto">
          <Button
            variant={view === "grid" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => onViewChange("grid")}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => onViewChange("list")}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={!category ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => onCategoryChange("")}
          >
            All
          </Badge>
          {FOOD_CATEGORIES.map((cat) => (
            <Badge
              key={cat}
              variant={category === cat ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => onCategoryChange(category === cat ? "" : cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-fg-secondary w-full sm:w-auto">
            Home & utility
          </span>
          {UTILITY_CATEGORIES.map((cat) => (
            <Badge
              key={cat}
              variant={category === cat ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => onCategoryChange(category === cat ? "" : cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {SUGGESTED_TAGS.map((tag) => (
          <Badge
            key={tag}
            variant={selectedTags.includes(tag) ? "secondary" : "outline"}
            className={cn("cursor-pointer transition-colors")}
            onClick={() => toggleTag(tag)}
          >
            {tag}
          </Badge>
        ))}
      </div>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onCategoryChange("");
            onTagsChange([]);
            onTimeRangeChange("all");
          }}
          className="text-fg-secondary"
        >
          <X className="h-4 w-4 mr-1" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
