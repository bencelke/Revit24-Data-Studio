"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FirestoreStatusBanner } from "@/components/imports/DataModeBadge";
import { InstagramResultsTable } from "./InstagramResultsTable";
import { ResultsActions } from "./ResultsActions";
import { ResultsSummaryCards } from "./ResultsSummaryCards";
import { buildInstagramExtractionCsv, downloadCsv } from "@/lib/utils/csvExport";
import {
  buildInstagramJsonExportFilename,
  downloadJsonFile,
  exportInstagramResultsToJson,
  type InstagramJsonExportRecord,
} from "@/lib/utils/jsonExport";
import {
  clearExtractionResults,
  deleteExtractionResult,
  listExtractionResultsSync,
  usesLocalStorage,
} from "@/lib/repositories/instagramExtractionStorage";
import { listQueueItemsSync } from "@/lib/repositories/instagramExtractionQueueStorage";
import {
  buildResultsSummary,
  mergeResultsView,
} from "@/lib/services/instagramExtractionQueueService";
import { MOCK_MODE_WARNING, getErrorMessage } from "@/lib/errors/app-errors";
import type { ExtractedInstagramProfile, ExtractorPageData, UploadStatus } from "@/lib/types/instagramExtraction";
import type { InstagramResultsSummary, InstagramResultsViewRow } from "@/lib/types/instagramExtractionQueue";
import type { UploadToRevit24ImportQueueResult } from "@/lib/types/simpleInstagramImport";

interface ResultsClientProps extends ExtractorPageData {
  initialResults: ExtractedInstagramProfile[];
}

const EMPTY_SUMMARY: InstagramResultsSummary = {
  pending: 0,
  running: 0,
  success: 0,
  failed: 0,
};

function isUploadable(row: InstagramResultsViewRow): boolean {
  return row.status === "success" || row.status === "completed" || row.status === "mock";
}

function toUploadableExtraction(row: InstagramResultsViewRow): ExtractedInstagramProfile | null {
  if (!isUploadable(row) || !row.extractionId) {
    return null;
  }

  return {
    id: row.extractionId,
    source: "instagram",
    username: row.username,
    profileUrl: row.profileUrl,
    profileImageUrl: row.profileImageUrl,
    displayName: row.displayName,
    bio: null,
    website: row.website,
    publicEmail: row.publicEmail,
    status: row.status === "mock" ? "mock" : "completed",
    error: row.errorMessage,
    errorCode: row.errorCode,
    errorMessage: row.errorMessage,
    extractedAt: row.extractedAt ?? new Date().toISOString(),
    createdAt: row.extractedAt ?? new Date().toISOString(),
    updatedAt: row.extractedAt ?? new Date().toISOString(),
  };
}

function buildUploadStatuses(
  rows: InstagramResultsViewRow[],
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

function mapRowToJsonExportRecord(row: InstagramResultsViewRow): InstagramJsonExportRecord {
  const status =
    row.status === "success" || row.status === "completed"
      ? "completed"
      : row.status === "mock"
        ? "mock"
        : row.status;

  return {
    source: "instagram",
    username: row.username,
    profileUrl: row.profileUrl,
    displayName: row.displayName,
    profileImageUrl: row.profileImageUrl,
    bio: null,
    website: row.website,
    publicEmail: row.publicEmail,
    status,
    errorCode: row.errorCode,
    errorMessage: row.errorMessage,
    extractedAt: row.extractedAt ?? new Date().toISOString(),
  };
}

function getExtractedRows(rows: InstagramResultsViewRow[]): InstagramResultsViewRow[] {
  return rows.filter((row) => row.extractionId);
}

export function ResultsClient({
  firebaseConnected,
  storageMode,
  extractorMode,
}: ResultsClientProps) {
  const [rows, setRows] = useState<InstagramResultsViewRow[]>([]);
  const [summary, setSummary] = useState<InstagramResultsSummary>(EMPTY_SUMMARY);
  const [mounted, setMounted] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadSummary, setUploadSummary] = useState<UploadToRevit24ImportQueueResult | null>(null);
  const [uploadStatuses, setUploadStatuses] = useState<Record<string, UploadStatus>>({});

  const loadResults = useCallback(async () => {
    if (usesLocalStorage()) {
      const queueItems = listQueueItemsSync();
      const extractions = listExtractionResultsSync();
      const merged = mergeResultsView(queueItems, extractions);
      setRows(merged);
      setSummary(buildResultsSummary(merged));
      return;
    }

    const response = await fetch("/api/instagram-extractor/results-view");
    const payload = (await response.json()) as {
      rows?: InstagramResultsViewRow[];
      summary?: InstagramResultsSummary;
      error?: string;
    };

    if (!response.ok) {
      throw new Error(payload.error ?? "Failed to load results.");
    }

    setRows(payload.rows ?? []);
    setSummary(payload.summary ?? EMPTY_SUMMARY);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true);
      void loadResults().catch(() => {
        // Results stay empty when unavailable.
      });
    });
  }, [loadResults]);

  const visibleRows = mounted ? rows : [];
  const extractedRows = getExtractedRows(visibleRows);
  const hasResults = visibleRows.length > 0;
  const hasExtractedRecords = extractedRows.length > 0;
  const uploadableRecords = visibleRows
    .map(toUploadableExtraction)
    .filter((row): row is ExtractedInstagramProfile => row != null);
  const hasUploadableRecords = uploadableRecords.length > 0;

  async function handleRefresh() {
    setIsRefreshing(true);
    setError(null);

    try {
      await loadResults();
    } catch (refreshError) {
      setError(getErrorMessage(refreshError));
    } finally {
      setIsRefreshing(false);
    }
  }

  function handleExportCsv() {
    if (!hasExtractedRecords) return;
    const csvRows = extractedRows.map((row) => ({
      id: row.extractionId as string,
      source: "instagram" as const,
      username: row.username,
      profileUrl: row.profileUrl,
      profileImageUrl: row.profileImageUrl,
      displayName: row.displayName,
      bio: null,
      website: row.website,
      publicEmail: row.publicEmail,
      status:
        row.status === "success" || row.status === "completed"
          ? ("completed" as const)
          : row.status === "mock"
            ? ("mock" as const)
            : ("failed" as const),
      error: row.errorMessage,
      errorCode: row.errorCode,
      errorMessage: row.errorMessage,
      extractedAt: row.extractedAt ?? new Date().toISOString(),
      createdAt: row.extractedAt ?? new Date().toISOString(),
      updatedAt: row.extractedAt ?? new Date().toISOString(),
    }));
    const csv = buildInstagramExtractionCsv(csvRows);
    downloadCsv(`revit24-instagram-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  }

  function handleExportJson() {
    if (!hasExtractedRecords) return;
    const records = extractedRows.map(mapRowToJsonExportRecord);
    const json = exportInstagramResultsToJson(records);
    downloadJsonFile(json, buildInstagramJsonExportFilename());
  }

  async function handleUploadToRevit24() {
    setIsUploading(true);
    setError(null);
    setUploadSummary(null);

    try {
      const response = await fetch("/api/instagram-import/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: uploadableRecords }),
      });
      const payload = (await response.json()) as UploadToRevit24ImportQueueResult & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to upload to Revit24.");
      }

      setUploadSummary(payload);
      setUploadStatuses((current) => buildUploadStatuses(visibleRows, payload, current));
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
        setRows([]);
        setSummary(EMPTY_SUMMARY);
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

      setRows([]);
      setSummary(EMPTY_SUMMARY);
      setUploadStatuses({});
    } catch (clearError) {
      setError(getErrorMessage(clearError));
    } finally {
      setIsClearing(false);
    }
  }

  async function handleRemove(id: string, extractionId: string | null) {
    if (!extractionId) {
      return;
    }

    setError(null);

    try {
      if (usesLocalStorage()) {
        const deleted = await deleteExtractionResult(extractionId);
        if (!deleted) {
          throw new Error("Result not found.");
        }
        await loadResults();
        setUploadStatuses((current) => {
          const next = { ...current };
          delete next[id];
          return next;
        });
        return;
      }

      const response = await fetch(`/api/instagram-extractor/results/${extractionId}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to delete result.");
      }

      await loadResults();
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
            Local worker extraction
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void handleRefresh()} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 size-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/instagram-extractor" />}>
            Back to Extractor
          </Button>
        </div>
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
              ? "Shows queued jobs and extracted profiles from Firestore. Run npm run worker:instagram locally to process pending jobs."
              : undefined
          }
        />
      )}

      <ResultsSummaryCards summary={summary} />

      <ResultsActions
        hasResults={hasResults}
        hasExtractedRecords={hasExtractedRecords}
        hasUploadableRecords={hasUploadableRecords}
        firebaseConnected={firebaseConnected}
        isClearing={isClearing}
        isUploading={isUploading}
        onExportCsv={handleExportCsv}
        onExportJson={handleExportJson}
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
        rows={visibleRows}
        uploadStatuses={uploadStatuses}
        onRemove={(id, extractionId) => void handleRemove(id, extractionId)}
      />
    </div>
  );
}
