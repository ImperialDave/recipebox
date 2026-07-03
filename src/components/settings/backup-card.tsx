"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { backupZipFilename } from "@/lib/backup/filenames";
import { toast } from "sonner";

export function BackupCard() {
  const [includePhotos, setIncludePhotos] = useState(true);
  const [ownedOnly, setOwnedOnly] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [canBackup, setCanBackup] = useState(true);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(true);

  const loadPreview = useCallback(async () => {
    setPreviewLoading(true);
    try {
      const params = new URLSearchParams({ owned_only: String(ownedOnly) });
      const res = await fetch(`/api/backup/preview?${params}`);
      const data = await res.json();
      if (res.ok) {
        setCount(data.count);
        setCanBackup(data.can_backup);
        setRetryAfter(data.retry_after_seconds);
      }
    } catch {
      setCount(null);
    } finally {
      setPreviewLoading(false);
    }
  }, [ownedOnly]);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        owned_only: String(ownedOnly),
        include_photos: String(includePhotos),
      });
      const res = await fetch(`/api/backup/recipes?${params}`);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 429) {
          toast.error(
            data.retry_after_seconds
              ? `Please wait ${Math.ceil(data.retry_after_seconds / 60)} minutes before another backup`
              : "Please wait before creating another backup"
          );
          setRetryAfter(data.retry_after_seconds ?? null);
          setCanBackup(false);
        } else {
          toast.error(data.error || "Backup failed");
        }
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = backupZipFilename();
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      toast.success(`Backup downloaded${count !== null ? ` (${count} recipes)` : ""}`);
      await loadPreview();
    } catch {
      toast.error("Could not download backup");
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || previewLoading || !canBackup || count === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data &amp; Backup</CardTitle>
        <CardDescription>
          Download your entire recipe library as a ZIP of printable HTML files
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Include photos</Label>
            <p className="text-sm text-brown-500">Add recipe hero images to the backup</p>
          </div>
          <Switch checked={includePhotos} onCheckedChange={setIncludePhotos} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>My recipes only</Label>
            <p className="text-sm text-brown-500">Exclude recipes shared from family groups</p>
          </div>
          <Switch checked={ownedOnly} onCheckedChange={setOwnedOnly} />
        </div>

        <p className="text-sm text-brown-600">
          {previewLoading
            ? "Checking your library..."
            : count === 0
              ? "No recipes available to back up yet."
              : `${count} recipe${count === 1 ? "" : "s"} will be included`}
        </p>

        {retryAfter !== null && retryAfter > 0 && (
          <p className="text-sm text-amber-700 dark:text-amber-400">
            You can create another backup in {Math.ceil(retryAfter / 60)} minute
            {Math.ceil(retryAfter / 60) === 1 ? "" : "s"}.
          </p>
        )}

        <Button onClick={handleDownload} disabled={disabled} className="w-full" size="lg">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Preparing backup...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Download Recipe Backup
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}