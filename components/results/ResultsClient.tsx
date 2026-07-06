"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FirestoreStatusBanner } from "@/components/imports/DataModeBadge";
import { InstagramResultsTable } from "./InstagramResultsTable";
import { ResultsActions } from "./ResultsActions";
import { buildInstagramExtractionCsv, downloadCsv } from "@/lib/utils/csvExport";
import {
  clearExtractionResults,
  deleteExtractionResult,
  listExtractionResultsSync,
  usesLocalStorage,
} from "@/lib/repositories/instagramExtractionStorage";
import { MOCK_MODE_WARNING, getErrorMessage } from "@/lib/errors/app-errors";
import type {
  ExtractedInstagramProfile,
  ExtractorPageData,
  UploadStatus,
} from "@/lib/types/instagramExtraction";
import type { UploadToRevit24ImportQueueResult } from "@/lib/types/simpleInstagramImport";

interface ResultsClientProps extends ExtractorPageData {
  initialResults: ExtractedInstagramProfile[];
}

function isUploadable(row: ExtractedInstagramProfile): boolean {
  return row.status === "completed" || row.status === "mock";
}

function buildUploadStatuses(
  rows: ExtractedInstagramProfile[],
  result: UploadToRevit24ImportQueueResult,
  previous: Record<string, UploadStatus>,
): Record<string, UploadStatus> {
  const next = { ...previous };
  const uploaded = new Set(result.uploadedUsernames.map((username) => username.toLowerCase()));
  const duplicates = new Set(result.duplicateUsernames.map((username) => username.toLowerCase()));

  for (const row of rows) {
    const key = row.username.toLowerCase();
    if (row.status === "failed") {
      next[row.id] = "failed";
      continue;
    }

    if (uploaded.has(key)) {
      next[row.id] = "uploaded";
      continue;
    }

    if (duplicates.has(key)) {
      next[row.id] = "duplicate";
    }
  }

  return next;
}

export function ResultsClient({
  firebaseConnected,
  storageMode,
  extractorMode,
  initialResults,
}: ResultsClientProps) {
  const [results, setResults] = useState<ExtractedInstagramProfile[]>(initialResults ?? []);
  const [mounted, setMounted] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadSummary, setUploadSummary] = useState<UploadToRevit24ImportQueueResult | null>(null);
  const [uploadStatuses, setUploadStatuses] = useState<Record<string, UploadStatus>>({});

  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true);

      if (usesLocalStorage()) {
        setResults(listExtractionResultsSync());
        return;
      }

      void fetch("/api/instagram-extractor/results")
        .then((response) => response.json())
        .then((payload: { results?: ExtractedInstagramProfile[] }) => {
          if (payload.results) {
            setResults(payload.results);
          }
        })
        .catch(() => {
          // Results stay empty when the API is unavailable.
        });
    });
  }, []);

  const rows = mounted ? results : [];
  const hasResults = rows.length > 0;
  const hasUploadableRecords = rows.some(isUploadable);

  function handleExportCsv() {
    if (!hasResults) return;
    const csv = buildInstagramExtractionCsv(rows);
    downloadCsv(`revit24-instagram-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  }

  async function handleUploadToRevit24() {
    setIsUploading(true);
    setError(null);
    setUploadSummary(null);

    try {
      const response = await fetch("/api/instagram-import/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: rows }),
      });
      const payload = (await response.json()) as UploadToRevit24ImportQueueResult & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to upload to Revit24.");
      }

      setUploadSummary(payload);
      setUploadStatuses((current) => buildUploadStatuses(rows, payload, current));
    } catch (uploadError) {
      setError(getErrorMessage(uploadError));
    } finally {
      setIsUploading(false);
    }
  }

  async function handleClear() {
    setIsClearing(true);
    setError(null);
    setUploadSummary(null);

    try {
      if (usesLocalStorage()) {
        await clearExtractionResults();
        setResults([]);
        setUploadStatuses({});
        return;
      }

      const response = await fetch("/api/instagram-extractor/results/clear", {
        method: "DELETE",
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to clear results.");
      }

      setResults([]);
      setUploadStatuses({});
    } catch (clearError) {
      setError(getErrorMessage(clearError));
    } finally {
      setIsClearing(false);
    }
  }

  async function handleRemove(id: string) {
    setError(null);

    try {
      if (usesLocalStorage()) {
        const deleted = await deleteExtractionResult(id);
        if (!deleted) {
          throw new Error("Result not found.");
        }
        setResults((current) => current.filter((row) => row.id !== id));
        setUploadStatuses((current) => {
          const next = { ...current };
          delete next[id];
          return next;
        });
        return;
      }

      const response = await fetch(`/api/instagram-extractor/results/${id}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to delete result.");
      }

      setResults((current) => current.filter((row) => row.id !== id));
      setUploadStatuses((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={storageMode === "live" ? "default" : "outline"}>
            {storageMode === "live" ? "Firebase Live Mode" : "Mock localStorage"}
          </Badge>
          <Badge variant={extractorMode === "live" ? "default" : "outline"}>
            {extractorMode === "live" ? "Live extraction" : "Mock extraction"}
          </Badge>
        </div>
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/instagram-extractor" />}>
          Back to Extractor
        </Button>
      </div>

      {storageMode === "mock" ? (
        <FirestoreStatusBanner
          variant="warning"
          title="Mock Mode"
          description={`${MOCK_MODE_WARNING} Results are stored in browser localStorage. Configure Firebase env vars in Vercel to enable Upload to Revit24.`}
        />
      ) : (
        <FirestoreStatusBanner
          variant="success"
          title="Firebase Connected"
          description={
            firebaseConnected
              ? "Results are stored in instagram_extractions. Upload sends successful rows to revit24_import_queue for Revit24.com review."
              : undefined
          }
        />
      )}

      <ResultsActions
        hasResults={hasResults}
        hasUploadableRecords={hasUploadableRecords}
        firebaseConnected={firebaseConnected}
        isClearing={isClearing}
        isUploading={isUploading}
        onExportCsv={handleExportCsv}
        onUploadToRevit24={() => void handleUploadToRevit24()}
        onClear={handleClear}
      />

      {uploadSummary ? (
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
          <p className="font-medium">Upload summary</p>
          <p className="mt-1 text-muted-foreground">
            Uploaded: {uploadSummary.uploadedCount} · Duplicates skipped:{" "}
            {uploadSummary.skippedDuplicateCount} · Failed extractions skipped: {uploadSummary.failedCount}
          </p>
          {uploadSummary.errors.length > 0 ? (
            <p className="mt-1 text-destructive">{uploadSummary.errors.join(" ")}</p>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <InstagramResultsTable
        rows={rows}
        uploadStatuses={uploadStatuses}
        onRemove={(id) => void handleRemove(id)}
      />
    </div>
  );
}
