"use client";

import { useMemo, useState } from "react";
import {
  getPassionSelectionValidationError,
  normalizeSelectedPassionSlugs,
  PASSION_SELECTION_MAX,
} from "@/lib/auth/passions";
import type { PassionOption } from "@/lib/auth/passions";
import { cn } from "@/lib/utils";

type PassionSelectionFieldsetProps = {
  passions: PassionOption[];
  selectedSlugs?: string[];
  inputName?: string;
  variant?: "pill" | "tile";
  className?: string;
};

export function PassionSelectionFieldset({
  passions,
  selectedSlugs = [],
  inputName = "passionSlugs",
  variant = "pill",
  className,
}: PassionSelectionFieldsetProps) {
  const [selection, setSelection] = useState(() => normalizeSelectedPassionSlugs(selectedSlugs));
  const selectedSet = useMemo(() => new Set(selection), [selection]);
  const validationError = getPassionSelectionValidationError(selection);
  const selectionCount = selection.length;

  function toggleSelection(slug: string) {
    setSelection((currentSelection) => {
      if (currentSelection.includes(slug)) {
        return currentSelection.filter((selectedSlug) => selectedSlug !== slug);
      }

      if (currentSelection.length >= PASSION_SELECTION_MAX) {
        return currentSelection;
      }

      return [...currentSelection, slug];
    });
  }

  return (
    <fieldset className={cn("flex min-w-0 flex-col gap-3", className)}>
      <div className="flex items-center justify-between gap-3 text-xs">
        <p className="font-medium text-foreground">Scegli da 1 a 3 passioni</p>
        <span
          className={cn(
            "inline-flex min-w-10 items-center justify-center rounded-full border px-2 py-1 font-semibold tabular-nums",
            validationError
              ? "border-destructive/40 bg-destructive/10 text-destructive"
              : selectionCount === PASSION_SELECTION_MAX
                ? "border-primary/35 bg-primary/12 text-primary"
                : "border-border/70 bg-surface-1 text-muted-foreground",
          )}
        >
          {selectionCount}/3
        </span>
      </div>

      {validationError ? (
        <p className="text-xs leading-relaxed text-destructive" aria-live="polite">
          {validationError}
        </p>
      ) : null}

      <div
        className={
          variant === "tile" ? "grid gap-2 sm:grid-cols-2" : "flex flex-wrap gap-2"
        }
      >
        {passions.map((passion) => {
          const isSelected = selectedSet.has(passion.slug);
          const isDisabled = !isSelected && selectionCount >= PASSION_SELECTION_MAX;

          if (variant === "tile") {
            return (
              <label
                key={passion.slug}
                className={cn(
                  "surface-soft flex items-center gap-3 p-3 text-sm transition-colors",
                  isDisabled ? "cursor-not-allowed opacity-55" : "cursor-pointer hover:border-primary/40",
                )}
              >
                <input
                  type="checkbox"
                  name={inputName}
                  value={passion.slug}
                  checked={isSelected}
                  disabled={isDisabled}
                  onChange={() => toggleSelection(passion.slug)}
                  className="size-4 rounded border-border bg-background accent-primary"
                />
                <span className="min-w-0 font-medium break-words">{passion.name}</span>
              </label>
            );
          }

          return (
            <label
              key={passion.slug}
              className={cn("cursor-pointer", isDisabled && "cursor-not-allowed opacity-55")}
            >
              <input
                type="checkbox"
                name={inputName}
                value={passion.slug}
                checked={isSelected}
                disabled={isDisabled}
                onChange={() => toggleSelection(passion.slug)}
                className="sr-only"
              />
              <span
                className={cn(
                  "inline-flex min-h-10 items-center rounded-full border px-3.5 py-2 text-sm font-medium transition-[border-color,background-color,color,box-shadow]",
                  isSelected
                    ? "border-primary/35 bg-primary/12 text-primary shadow-[0_12px_24px_-20px_oklch(0.73_0.16_294_/_0.72)]"
                    : "border-border/80 bg-surface-1 text-foreground",
                )}
              >
                {passion.name}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
