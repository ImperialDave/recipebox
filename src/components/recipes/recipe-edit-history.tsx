"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ChevronDown, History } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getDisplayName } from "@/lib/utils";
import type { RecipeEdit } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RecipeEditHistoryProps {
  edits: RecipeEdit[];
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function EditEntry({ edit }: { edit: RecipeEdit }) {
  const [expanded, setExpanded] = useState(false);
  const editorName = getDisplayName(edit.editor);
  const hasDetails = edit.changes.length > 0;

  return (
    <div className="rounded-xl border border-border bg-elevated p-4">
      <div className="flex items-start gap-3">
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarImage src={edit.editor?.avatar_url || undefined} />
          <AvatarFallback className="bg-accent-subtle text-accent text-xs">
            {initials(editorName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-fg">{editorName}</p>
              <p className="text-sm text-fg-muted">
                {format(new Date(edit.edited_at), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
            {hasDetails && (
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0"
                onClick={() => setExpanded((value) => !value)}
              >
                {expanded ? "Hide" : "Details"}
                <ChevronDown
                  className={cn(
                    "ml-1 h-4 w-4 transition-transform",
                    expanded && "rotate-180",
                  )}
                />
              </Button>
            )}
          </div>
          <p className="mt-2 text-sm text-fg-secondary">
            {edit.action === "created" ? "Recipe created" : edit.summary}
          </p>
          {expanded && hasDetails && (
            <ul className="mt-3 space-y-2 text-sm text-fg-secondary">
              {edit.changes.map((change) => (
                <li key={`${edit.id}-${change.field}`}>
                  <span className="font-medium text-fg">{change.label}:</span>{" "}
                  {change.details && change.details.length > 0 ? (
                    <ul className="mt-1 space-y-1 pl-4">
                      {change.details.map((detail, index) => (
                        <li key={`${change.field}-${index}`}>{detail}</li>
                      ))}
                    </ul>
                  ) : (
                    <span>
                      {change.before} → {change.after}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export function RecipeEditHistory({ edits }: RecipeEditHistoryProps) {
  if (edits.length === 0) {
    return (
      <section>
        <h2 className="font-serif text-2xl font-semibold text-fg mb-3 flex items-center gap-2">
          <History className="h-6 w-6 text-accent" />
          Edit History
        </h2>
        <p className="text-fg-secondary">
          No edits recorded yet. Changes will appear here after the recipe is
          updated.
        </p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="font-serif text-2xl font-semibold text-fg mb-4 flex items-center gap-2">
        <History className="h-6 w-6 text-accent" />
        Edit History
      </h2>
      <div className="space-y-3">
        {edits.map((edit) => (
          <EditEntry key={edit.id} edit={edit} />
        ))}
      </div>
    </section>
  );
}