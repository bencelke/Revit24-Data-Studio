"use client";

import { useState } from "react";
import Link from "next/link";
import { DataModeBadge, FirestoreStatusBanner } from "@/components/imports/DataModeBadge";
import { Button } from "@/components/ui/button";
import { InstagramResultsTable } from "./InstagramResultsTable";
import { ResultsActions } from "./ResultsActions";
import { buildSimpleInstagramCsv, downloadCsv } from "@/lib/utils/csvExport";
import {
  clearSimpleImportResults,
  loadSimpleImportResults,
  saveSimpleImportResults,
} from "@/lib/utils/simpleImportStorage";
import { MOCK_MODE_WARNING, getErrorMessage } from "@/lib/errors/app-errors";
import type { SimpleExtractedProfile, SimpleImportPageData, UploadToRevit24Result } from "@/lib/types/simpleInstagramImport";

type ResultsClientProps = SimpleImportPageData;

export function ResultsClient({ firebaseConfigured, dataMode }: ResultsClientProps) {
  const [rows, setRows] = useState<SimpleExtractedProfile[]>(() => loadSimpleImportResults());
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function persist(next: SimpleExtractedProfile[]) {
    setRows(next);
    saveSimpleImportResults(next);
  }

  function handleExportCsv() {
    if (rows.length === 0) return;
    const csv = buildSimpleInstagramCsv(rows);
    downloadCsv(`revit24-instagram-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  }

  async function handleUpload() {
    if (rows.length === 0) return;

    setIsUploading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/instagram-import/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: rows }),
      });

      const payload = (await response.json()) as UploadToRevit24Result & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Upload failed.");
      }

      let text = `Uploaded ${payload.successCount} profile(s) to Revit24 (${payload.dataMode} mode).`;
      if (payload.failedCount > 0) {
        text += ` ${payload.failedCount} failed extraction(s) skipped.`;
      }
      if (payload.duplicateCount > 0) {
        text += ` ${payload.duplicateCount} duplicate(s) skipped: ${payload.duplicateUsernames.join(", ")}.`;
      }
      setMessage(text);
    } catch (uploadError) {
      setError(getErrorMessage(uploadError));
    } finally {
      setIsUploading(false);
    }
  }

  function handleClear() {
    clearSimpleImportResults();
    setRows([]);
    setError(null);
    setMessage(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DataModeBadge dataMode={dataMode} firebaseConfigured={firebaseConfigured} />
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/instagram-import" />}>
          Back to Import
        </Button>
      </div>

      {dataMode === "mock" ? (
        <FirestoreStatusBanner
          variant="warning"
          title="Mock Mode"
          description={MOCK_MODE_WARNING}
        />
      ) : null}

      <ResultsActions
        hasResults={rows.length > 0}
        isUploading={isUploading}
        onExportCsv={handleExportCsv}
        onUpload={handleUpload}
        onClear={handleClear}
      />

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {message}
        </div>
      ) : null}

      <InstagramResultsTable
        rows={rows}
        onRemove={(id) => persist(rows.filter((row) => row.id !== id))}
      />
    </div>
  );
}
