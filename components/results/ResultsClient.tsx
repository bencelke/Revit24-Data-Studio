"use client";

import { useState, useSyncExternalStore } from "react";
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
  subscribeToExtractionResults,
  usesLocalStorage,
} from "@/lib/repositories/instagramExtractionStorage";
import { MOCK_MODE_WARNING, getErrorMessage } from "@/lib/errors/app-errors";
import { useIsClientReady } from "@/hooks/useIsClientReady";
import type { ExtractedInstagramProfile, ExtractorPageData } from "@/lib/types/instagramExtraction";

interface ResultsClientProps extends ExtractorPageData {
  initialResults: ExtractedInstagramProfile[];
}

function useLocalExtractionResults(): ExtractedInstagramProfile[] {
  return useSyncExternalStore(
    subscribeToExtractionResults,
    listExtractionResultsSync,
    () => [],
  );
}

export function ResultsClient({
  firebaseConnected,
  storageMode,
  extractorMode,
  initialResults,
}: ResultsClientProps) {
  const isClientReady = useIsClientReady();
  const localRows = useLocalExtractionResults();
  const [firestoreRows, setFirestoreRows] = useState(initialResults);
  const rows = usesLocalStorage()
    ? isClientReady
      ? localRows
      : []
    : firestoreRows;
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleExportCsv() {
    if (rows.length === 0) return;
    const csv = buildInstagramExtractionCsv(rows);
    downloadCsv(`revit24-instagram-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  }

  async function handleClear() {
    setIsClearing(true);
    setError(null);

    try {
      if (usesLocalStorage()) {
        await clearExtractionResults();
        return;
      }

      const response = await fetch("/api/instagram-extractor/results/clear", {
        method: "DELETE",
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to clear results.");
      }

      setFirestoreRows([]);
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
        return;
      }

      const response = await fetch(`/api/instagram-extractor/results/${id}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to delete result.");
      }

      setFirestoreRows((current) => current.filter((row) => row.id !== id));
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={storageMode === "live" ? "default" : "outline"}>
            {storageMode === "live" ? "Live Firestore" : "Mock storage"}
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
          description={`${MOCK_MODE_WARNING} Results are stored in browser localStorage.`}
        />
      ) : (
        <FirestoreStatusBanner
          variant="success"
          title="Firebase Connected"
          description={
            firebaseConnected
              ? "Results are stored in the instagram_extractions Firestore collection."
              : undefined
          }
        />
      )}

      <ResultsActions
        hasResults={rows.length > 0}
        isClearing={isClearing}
        onExportCsv={handleExportCsv}
        onClear={handleClear}
      />

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <InstagramResultsTable rows={rows} onRemove={(id) => void handleRemove(id)} />
    </div>
  );
}
