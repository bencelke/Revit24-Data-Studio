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
import { applyResultsFilter, ResultsFilters, type ResultsFilter } from "./ResultsFilters";
import { buildInstagramExtractionCsv, downloadCsv } from "@/lib/utils/csvExport";
import {
  buildInstagramProfilesJsonFilename,
  downloadJsonFile,
  exportInstagramProfilesToJson,
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
import type { ExtractedInstagramProfile, ExtractorPageData } from "@/lib/types/instagramExtraction";
import type { InstagramResultsSummary, InstagramResultsViewRow } from "@/lib/types/instagramExtractionQueue";

interface ResultsClientProps extends ExtractorPageData {
  initialResults: ExtractedInstagramProfile[];
}

const EMPTY_SUMMARY: InstagramResultsSummary = {
  pending: 0,
  running: 0,
  success: 0,
  failed: 0,
};

function mapRowToJsonExportRecord(row: InstagramResultsViewRow): InstagramJsonExportRecord {
  const status =
    row.status === "success" || row.status === "completed" || row.status === "mock"
      ? "success"
      : row.status;

  return {
    source: "instagram",
    entityType: row.entityType,
    username: row.username,
    profileUrl: row.profileUrl,
    displayName: row.displayName,
    profileImageUrl: row.profileImageUrl,
    bio: row.bio,
    website: row.website,
    publicEmail: row.publicEmail,
    status,
    errorCode: row.errorCode ?? "",
    errorMessage: row.errorMessage ?? "",
    extractedAt: row.extractedAt ?? new Date().toISOString(),
  };
}

function getExtractedRows(rows: InstagramResultsViewRow[]): InstagramResultsViewRow[] {
  return rows.filter((row) => row.extractionId);
}

export function ResultsClient({
  firebaseConnected,
  storageMode,
}: ResultsClientProps) {
  const [rows, setRows] = useState<InstagramResultsViewRow[]>([]);
  const [summary, setSummary] = useState<InstagramResultsSummary>(EMPTY_SUMMARY);
  const [filter, setFilter] = useState<ResultsFilter>("all");
  const [mounted, setMounted] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  const filteredRows = applyResultsFilter(visibleRows, filter);
  const extractedRows = getExtractedRows(visibleRows);
  const hasResults = visibleRows.length > 0;
  const hasExtractedRecords = extractedRows.length > 0;

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
      entityType: row.entityType,
      username: row.username,
      profileUrl: row.profileUrl,
      profileImageUrl: row.profileImageUrl,
      displayName: row.displayName,
      bio: row.bio,
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
    const json = exportInstagramProfilesToJson(records);
    downloadJsonFile(json, buildInstagramProfilesJsonFilename());
  }

  async function handleClear() {
    setIsClearing(true);
    setError(null);

    try {
      if (usesLocalStorage()) {
        await clearExtractionResults();
        setRows([]);
        setSummary(EMPTY_SUMMARY);
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
          <Badge variant="outline">Local worker extraction</Badge>
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
          description={`${MOCK_MODE_WARNING} Results are stored in browser localStorage.`}
        />
      ) : (
        <FirestoreStatusBanner
          variant="success"
          title="Firebase Connected"
          description={
            firebaseConnected
              ? "Queue jobs in Firestore, run npm run worker:instagram locally, then export JSON for Revit24.com."
              : undefined
          }
        />
      )}

      <ResultsSummaryCards summary={summary} />

      <ResultsActions
        hasExtractedRecords={hasExtractedRecords}
        hasResults={hasResults}
        isClearing={isClearing}
        onExportCsv={handleExportCsv}
        onExportJson={handleExportJson}
        onClear={handleClear}
      />

      <ResultsFilters value={filter} onChange={setFilter} />

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <InstagramResultsTable
        rows={filteredRows}
        onRemove={(id, extractionId) => void handleRemove(id, extractionId)}
      />
    </div>
  );
}
