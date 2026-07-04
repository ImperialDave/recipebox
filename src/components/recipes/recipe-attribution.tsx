import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getDisplayName } from "@/lib/utils";
import type { Profile, RecipeEdit } from "@/lib/types";

interface RecipeAttributionProps {
  owner?: Profile;
  createdAt: string;
  lastEdit?: RecipeEdit;
  variant?: "default" | "compact" | "print";
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function RecipeAttribution({
  owner,
  createdAt,
  lastEdit,
  variant = "default",
}: RecipeAttributionProps) {
  const creatorName = getDisplayName(owner);
  const createdLabel = format(new Date(createdAt), "MMM d, yyyy");

  if (variant === "print") {
    return (
      <p className="text-sm text-gray-600 mb-4">
        Added by {creatorName} · {createdLabel}
      </p>
    );
  }

  if (variant === "compact") {
    return (
      <p className="text-sm text-fg-secondary truncate">by {creatorName}</p>
    );
  }

  const showLastEdit =
    lastEdit &&
    lastEdit.action === "updated" &&
    new Date(lastEdit.edited_at).getTime() >
      new Date(createdAt).getTime() + 1000;

  return (
    <div className="flex items-center gap-3 text-sm text-fg-secondary">
      <Avatar className="h-9 w-9">
        <AvatarImage src={owner?.avatar_url || undefined} />
        <AvatarFallback className="bg-accent-subtle text-accent text-xs">
          {initials(creatorName)}
        </AvatarFallback>
      </Avatar>
      <div>
        <p>
          Added by <span className="font-medium text-fg">{creatorName}</span> ·{" "}
          {createdLabel}
        </p>
        {showLastEdit && (
          <p className="text-fg-muted">
            Last updated{" "}
            {format(new Date(lastEdit.edited_at), "MMM d, yyyy")} by{" "}
            {getDisplayName(lastEdit.editor)}
          </p>
        )}
      </div>
    </div>
  );
}