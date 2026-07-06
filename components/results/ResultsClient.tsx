"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FirestoreStatusBanner } from "@/components/imports/DataModeBadge";
import { InstagramResultsTable } from "./InstagramResultsTable";
import { ResultsActions } from "./ResultsActions";
import { ResultsEmptyState } from "./ResultsEmptyState";
import { ResultsSummaryCards, type InstagramExtractedResultsSummary } from "./ResultsSummaryCards";
import { applyResultsFilter, ResultsFilters, type ResultsFilter } from "./ResultsFilters";
import { buildInstagramExtractionCsv, downloadCsv } from "@/lib/utils/csvExport";
import {
  buildInstagramProfilesJsonFilename,
  downloadJsonFile,
  exportInstagramProfilesToJson,
  filterRecordsForExportScope,
  type InstagramJsonExportRecord,
  type JsonExportScope,
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
import { detectInstagramEntityType } from "@/lib/services/entityTypeDetectionService";
import { MOCK_MODE_WARNING, getErrorMessage } from "@/lib/errors/app-errors";
import type { ExtractedInstagramProfile, ExtractorPageData } from "@/lib/types/instagramExtraction";
import type { InstagramResultsSummary, InstagramResultsViewRow } from "@/lib/types/instagramExtractionQueue";

interface ResultsClientProps extends ExtractorPageData {
  initialResults: ExtractedInstagramProfile[];
}

const EMPTY_QUEUE_SUMMARY: InstagramResultsSummary = {
  pending: 0,
  running: 0,
  success: 0,
  failed: 0,
};

function normalizeExportStatus(status: string): string {
  if (status === "success" || status === "completed" || status === "mock") {
    return "success";
  }
  return status;
}

function isSuccessfulRow(status: string): boolean {
  return status === "success" || status === "completed" || status === "mock";
}

function resolveRowEntityType(row: InstagramResultsViewRow) {
  return detectInstagramEntityType({
    username: row.username,
    displayName: row.displayName,
    bio: row.bio,
    status: normalizeExportStatus(row.status),
  });
}

function mapRowToJsonExportRecord(row: InstagramResultsViewRow): InstagramJsonExportRecord {
  return {
    source: "instagram",
    entityType: resolveRowEntityType(row),
    username: row.username,
    profileUrl: row.profileUrl,
    displayName: row.displayName,
    profileImageUrl: row.profileImageUrl,
    bio: row.bio,
    website: row.website,
    publicEmail: row.publicEmail,
    status: normalizeExportStatus(row.status),
    errorCode: row.errorCode ?? "",
    errorMessage: row.errorMessage ?? "",
    extractedAt: row.extractedAt ?? new Date().toISOString(),
  };
}

function getExtractedRows(rows: InstagramResultsViewRow[]): InstagramResultsViewRow[] {
  return rows.filter((row) => row.extractionId);
}

function buildExtractedSummary(rows: InstagramResultsViewRow[]): InstagramExtractedResultsSummary {
  const extracted = getExtractedRows(rows);
  const summary: InstagramExtractedResultsSummary = {
    total: extracted.length,
    clubs: 0,
    members: 0,
    unknown: 0,
    success: 0,
    failed: 0,
  };

  for (const row of extracted) {
    const entityType = resolveRowEntityType(row);
    if (entityType === "club") summary.clubs += 1;
    else if (entityType === "member") summary.members += 1;
    else summary.unknown += 1;

    if (isSuccessfulRow(row.status)) summary.success += 1;
    else if (row.status === "failed") summary.failed += 1;
  }

  return summary;
}

export function ResultsClient({
  firebaseConnected,
  storageMode,
}: ResultsClientProps) {
  const [rows, setRows] = useState<InstagramResultsViewRow[]>([]);
  const [queueSummary, setQueueSummary] = useState<InstagramResultsSummary>(EMPTY_QUEUE_SUMMARY);
  const [filter, setFilter] = useState<ResultsFilter>("all");
  const [exportScope, setExportScope] = useState<JsonExportScope>("successful");
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
      setQueueSummary(buildResultsSummary(merged));
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
    setQueueSummary(payload.summary ?? EMPTY_QUEUE_SUMMARY);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true);
      void loadResults().catch(() => {
        // Results stay empty when unavailable.
      });
    });
  }, [loadResults]);

  const visibleRows = useMemo(() => (mounted ? rows : []), [mounted, rows]);
  const extractedRows = useMemo(() => getExtractedRows(visibleRows), [visibleRows]);
  const extractedSummary = useMemo(() => buildExtractedSummary(visibleRows), [visibleRows]);
  const filteredRows = applyResultsFilter(visibleRows, filter);
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

  function getExportRecords(): InstagramJsonExportRecord[] {
    return extractedRows.map(mapRowToJsonExportRecord);
  }

  function handleExportCsv() {
    if (!hasExtractedRecords) return;
    const records = filterRecordsForExportScope(getExportRecords(), exportScope);
    const csvRows = records.map((record) => ({
      id: `export_${record.username}`,
      source: "instagram" as const,
      entityType: record.entityType,
      username: record.username,
      profileUrl: record.profileUrl,
      profileImageUrl: record.profileImageUrl,
      displayName: record.displayName,
      bio: record.bio,
      website: record.website,
      publicEmail: record.publicEmail,
      status:
        record.status === "success"
          ? ("completed" as const)
          : record.status === "mock"
            ? ("mock" as const)
            : ("failed" as const),
      error: record.errorMessage,
      errorCode: record.errorCode,
      errorMessage: record.errorMessage,
      extractedAt: record.extractedAt,
      createdAt: record.extractedAt,
      updatedAt: record.extractedAt,
    }));
    const csv = buildInstagramExtractionCsv(csvRows);
    downloadCsv(`revit24-instagram-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  }

  function handleExportJson() {
    if (!hasExtractedRecords) return;
    const records = getExportRecords();
    const json = exportInstagramProfilesToJson(records, { scope: exportScope });
    downloadJsonFile(json, buildInstagramProfilesJsonFilename());
  }

  async function handleClear() {
    setIsClearing(true);
    setError(null);

    try {
      if (usesLocalStorage()) {
        await clearExtractionResults();
        setRows([]);
        setQueueSummary(EMPTY_QUEUE_SUMMARY);
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
      setQueueSummary(EMPTY_QUEUE_SUMMARY);
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
          {queueSummary.pending > 0 ? (
            <Badge variant="outline">{queueSummary.pending} pending in queue</Badge>
          ) : null}
        </div>
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/instagram-extractor" />}>
          Back to Extractor
        </Button>
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
              ? "Queue profiles, run npm run worker:instagram on your Mac, then export JSON for Revit24.com."
              : undefined
          }
        />
      )}

      <ResultsActions
        hasExtractedRecords={hasExtractedRecords}
        hasResults={hasResults}
        isClearing={isClearing}
        isRefreshing={isRefreshing}
        exportScope={exportScope}
        onExportScopeChange={setExportScope}
        onExportJson={handleExportJson}
        onExportCsv={handleExportCsv}
        onRefresh={() => void handleRefresh()}
        onClear={handleClear}
      />

      {hasExtractedRecords ? (
        <>
          <ResultsSummaryCards summary={extractedSummary} />
          <ResultsFilters value={filter} onChange={setFilter} />
        </>
      ) : (
        <ResultsEmptyState />
      )}

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {hasExtractedRecords ? (
        <InstagramResultsTable
          rows={filteredRows}
          onRemove={(id, extractionId) => void handleRemove(id, extractionId)}
        />
      ) : null}
    </div>
  );
}
