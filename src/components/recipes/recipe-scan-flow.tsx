"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Camera, ChevronDown, Loader2, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { uploadRecipeImage } from "@/lib/actions/recipes";
import {
  isSupportedImageFile,
  prepareImageFile,
  prepareImageFileForUpload,
} from "@/lib/image/prepare-image-file";
import { parsedRecipeToFormData } from "@/lib/recipe-scan/to-form-data";
import type { ParsedRecipeDraft } from "@/lib/recipe-scan/types";
import type { RecipeFormData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface RecipeScanFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (data: Partial<RecipeFormData>) => void;
}

type Step = "pick" | "scanning" | "review";

function ConfidenceBadge({ level }: { level?: string }) {
  if (!level || level === "high") return null;
  return (
    <span
      className={cn(
        "text-xs font-medium px-2 py-0.5 rounded-full",
        level === "medium"
          ? "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100"
          : "bg-red-100 text-red-900 dark:bg-red-950/50 dark:text-red-100",
      )}
    >
      review
    </span>
  );
}

export function RecipeScanFlow({
  open,
  onOpenChange,
  onApply,
}: RecipeScanFlowProps) {
  const [step, setStep] = useState<Step>("pick");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedRecipeDraft | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [usePhotoAsHero, setUsePhotoAsHero] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showIngredients, setShowIngredients] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep("pick");
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setParsed(null);
    setRemaining(null);
    setUsePhotoAsHero(true);
    setShowIngredients(false);
    setShowInstructions(false);
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  const handleFileChange = async (selected: File | null) => {
    if (!selected) return;
    if (!isSupportedImageFile(selected)) {
      toast.error("Please choose a JPG, PNG, WebP, or iPhone photo");
      return;
    }

    try {
      const prepared = await prepareImageFile(selected);
      setFile(prepared);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(prepared));
    } catch {
      toast.error(
        "Could not read this photo. Try another image or take a new picture.",
      );
    }
  };

  const handleScan = async () => {
    if (!file) return;
    setStep("scanning");

    try {
      const body = new FormData();
      body.append("image", file);

      const response = await fetch("/api/recipes/scan", {
        method: "POST",
        body,
      });

      const data = await response.json();

      if (typeof data.remaining === "number") {
        setRemaining(data.remaining);
      }

      if (!response.ok) {
        if (data.parsed) {
          setParsed(data.parsed);
          setStep("review");
          toast.error(data.error || "Scan needs review");
          return;
        }
        throw new Error(data.error || "Scan failed");
      }

      setParsed(data.parsed);
      setStep("review");
      toast.success("Recipe scanned — review the details below");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not scan recipe photo",
      );
      setStep("pick");
    }
  };

  const handleApply = async () => {
    if (!parsed) return;
    setApplying(true);
    try {
      let heroUrl: string | null = null;
      if (usePhotoAsHero && file) {
        heroUrl = await uploadRecipeImage(
          await prepareImageFileForUpload(file),
        );
      }

      onApply(parsedRecipeToFormData(parsed, heroUrl));
      toast.success("Scanned recipe applied to the form");
      handleClose(false);
    } catch {
      toast.error("Could not apply scanned recipe");
    } finally {
      setApplying(false);
    }
  };

  const reviewSummary = useMemo(() => {
    if (!parsed) return null;
    return [
      parsed.title ? `Title: ${parsed.title}` : null,
      parsed.servings ? `Servings: ${parsed.servings}` : null,
      parsed.ingredients.length
        ? `Ingredients: ${parsed.ingredients.length}`
        : null,
      parsed.instructions.length
        ? `Steps: ${parsed.instructions.length}`
        : null,
    ].filter(Boolean);
  }, [parsed]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl flex items-center gap-2">
            <ScanLine className="h-6 w-6 text-accent" />
            Scan Recipe from Photo
          </DialogTitle>
          <DialogDescription>
            Take a photo or upload an image of a recipe card, cookbook page, or
            screenshot. We&apos;ll extract the details for you to review before
            saving.
          </DialogDescription>
        </DialogHeader>

        {step === "pick" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
              Your photo is sent to Google Gemini AI for text extraction. It is
              not stored by the AI service after processing.
            </div>

            {previewUrl ? (
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border">
                <Image
                  src={previewUrl}
                  alt="Recipe scan preview"
                  fill
                  className="object-contain bg-overlay"
                />
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border-strong px-6 py-12 cursor-pointer hover:border-accent transition-colors">
                <Camera className="h-10 w-10 text-accent" />
                <div className="text-center">
                  <p className="font-medium text-fg">Take or upload a photo</p>
                  <p className="text-sm text-fg-secondary mt-1">
                    iPhone photos, JPG, PNG, or WebP up to 10 MB
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*,.heic,.heif"
                  capture="environment"
                  className="hidden"
                  onChange={(event) =>
                    handleFileChange(event.target.files?.[0] || null)
                  }
                />
              </label>
            )}

            {previewUrl && (
              <div className="flex gap-3">
                <input
                  ref={replaceInputRef}
                  type="file"
                  accept="image/*,.heic,.heif"
                  capture="environment"
                  className="hidden"
                  onChange={(event) =>
                    handleFileChange(event.target.files?.[0] || null)
                  }
                />
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => replaceInputRef.current?.click()}
                >
                  Choose different photo
                </Button>
                <Button className="flex-1" onClick={handleScan}>
                  Scan recipe
                </Button>
              </div>
            )}
          </div>
        )}

        {step === "scanning" && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-accent mb-4" />
            <p className="font-medium text-fg">Reading your recipe...</p>
            <p className="text-sm text-fg-secondary mt-1">
              This usually takes a few seconds
            </p>
          </div>
        )}

        {step === "review" && parsed && (
          <div className="grid gap-6 lg:grid-cols-2">
            {previewUrl && (
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border">
                <Image
                  src={previewUrl}
                  alt="Scanned recipe"
                  fill
                  className="object-contain bg-overlay"
                />
              </div>
            )}

            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-elevated p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-fg">Extracted details</h3>
                  {remaining != null && (
                    <span className="text-xs text-fg-muted">
                      {remaining} scans left today
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-fg">Title</span>
                    <ConfidenceBadge level={parsed.fieldConfidence.title} />
                  </div>
                  <p className="text-fg-secondary">
                    {parsed.title || "Not detected"}
                  </p>

                  {reviewSummary?.slice(1).map((line) => (
                    <p key={line} className="text-fg-secondary">
                      {line}
                    </p>
                  ))}
                </div>

                {parsed.warnings.length > 0 && (
                  <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
                    {parsed.warnings.map((warning) => (
                      <li key={warning}>• {warning}</li>
                    ))}
                  </ul>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="px-0"
                  onClick={() => setShowIngredients((value) => !value)}
                >
                  Ingredients ({parsed.ingredients.length})
                  <ChevronDown
                    className={cn(
                      "ml-1 h-4 w-4 transition-transform",
                      showIngredients && "rotate-180",
                    )}
                  />
                </Button>
                {showIngredients && (
                  <ul className="text-sm text-fg-secondary space-y-1 max-h-40 overflow-y-auto">
                    {parsed.ingredients.map((ingredient, index) => (
                      <li key={`${ingredient.name}-${index}`}>
                        {[ingredient.quantity, ingredient.unit, ingredient.name]
                          .filter(Boolean)
                          .join(" ")}
                        {ingredient.prep_note ? `, ${ingredient.prep_note}` : ""}
                      </li>
                    ))}
                  </ul>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="px-0"
                  onClick={() => setShowInstructions((value) => !value)}
                >
                  Instructions ({parsed.instructions.length})
                  <ChevronDown
                    className={cn(
                      "ml-1 h-4 w-4 transition-transform",
                      showInstructions && "rotate-180",
                    )}
                  />
                </Button>
                {showInstructions && (
                  <ol className="text-sm text-fg-secondary space-y-2 max-h-48 overflow-y-auto list-decimal list-inside">
                    {parsed.instructions.map((instruction, index) => (
                      <li key={`${index}-${instruction.text.slice(0, 20)}`}>
                        {instruction.text}
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={usePhotoAsHero}
                  onCheckedChange={(checked) =>
                    setUsePhotoAsHero(checked === true)
                  }
                />
                <div>
                  <Label>Use this photo as the hero image</Label>
                  <p className="text-sm text-fg-secondary">
                    Recommended so the saved recipe keeps the original card
                  </p>
                </div>
              </label>

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep("pick");
                    setParsed(null);
                  }}
                >
                  Rescan
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleApply}
                  disabled={applying}
                >
                  {applying ? "Applying..." : "Apply to form"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}