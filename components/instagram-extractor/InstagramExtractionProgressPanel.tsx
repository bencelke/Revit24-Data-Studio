"use client";

import type { InstagramExtractionProgress } from "@/lib/types/instagramExtraction";

interface InstagramExtractionProgressPanelProps {
  progress: InstagramExtractionProgress;
  isRunning: boolean;
}

export function InstagramExtractionProgressPanel({
  progress,
  isRunning,
}: InstagramExtractionProgressPanelProps) {
  const percent = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">
          {isRunning ? "Extracting profiles..." : "Extraction complete"}
        </p>
        <p className="text-sm text-muted-foreground">
          {progress.current} / {progress.total}
        </p>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-brand transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-border bg-background px-3 py-2">
          <p className="text-xs text-muted-foreground">Current profile</p>
          <p className="font-mono text-sm font-medium">@{progress.username || "—"}</p>
        </div>
        <div className="rounded-md border border-border bg-background px-3 py-2">
          <p className="text-xs text-muted-foreground">Succeeded</p>
          <p className="text-sm font-semibold text-emerald-400">{progress.succeeded}</p>
        </div>
        <div className="rounded-md border border-border bg-background px-3 py-2">
          <p className="text-xs text-muted-foreground">Failed</p>
          <p className="text-sm font-semibold text-destructive">{progress.failed}</p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{progress.statusMessage}</p>
    </div>
  );
}
