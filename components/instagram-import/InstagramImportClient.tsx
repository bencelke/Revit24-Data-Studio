"use client";

import { useMemo, useState } from "react";
import { Download, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataModeBadge, FirestoreStatusBanner } from "@/components/imports/DataModeBadge";
import { InstagramImportForm } from "./InstagramImportForm";
import { InstagramImportSummary } from "./InstagramImportSummary";
import { InstagramImportResultsTable } from "./InstagramImportResultsTable";
import {
  buildImportSummary,
  parseInstagramSimpleInput,
} from "@/lib/validation/instagramSimpleInput";
import { buildInstagramSimpleImportCsv } from "@/lib/services/instagramSimpleImportService";
import { MOCK_MODE_WARNING, getErrorMessage } from "@/lib/errors/app-errors";
import type {
  InstagramSimpleExtractedRow,
  InstagramSimpleImportPageData,
  InstagramSimpleImportSummary,
} from "@/lib/types/instagramSimpleImport";

const EMPTY_SUMMARY: InstagramSimpleImportSummary = {
  totalLinks: 0,
  valid: 0,
  duplicates: 0,
  invalid: 0,
  extracted: 0,
  failed: 0,
};

type InstagramImportClientProps = InstagramSimpleImportPageData;

export function InstagramImportClient({
  firebaseConfigured,
  dataMode,
  extractionLive,
}: InstagramImportClientProps) {
  const [input, setInput] = useState("");
  const [parseSummary, setParseSummary] = useState(EMPTY_SUMMARY);
  const [validProfiles, setValidProfiles] = useState<
    { username: string; profileUrl: string }[]
  >([]);
  const [results, setResults] = useState<InstagramSimpleExtractedRow[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isQueueing, setIsQueueing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const summary = useMemo(
    () =>
      buildImportSummary(
        {
          totalLinks: parseSummary.totalLinks,
          valid: parseSummary.valid,
          duplicates: parseSummary.duplicates,
          invalid: parseSummary.invalid,
        },
        results,
      ),
    [parseSummary, results],
  );

  function handlePreview() {
    const parsed = parseInstagramSimpleInput(input);
    setParseSummary({
      ...parsed.summary,
      extracted: 0,
      failed: 0,
    });
    setValidProfiles(
      parsed.rows
        .filter((row) => row.validationStatus === "valid" && row.username && row.profileUrl)
        .map((row) => ({
          username: row.username as string,
          profileUrl: row.profileUrl as string,
        })),
    );
    setError(null);
    setSuccessMessage(null);
  }

  async function handleExtract() {
    if (validProfiles.length === 0) {
      handlePreview();
    }

    const profiles =
      validProfiles.length > 0
        ? validProfiles
        : parseInstagramSimpleInput(input)
            .rows.filter((row) => row.validationStatus === "valid" && row.username && row.profileUrl)
            .map((row) => ({
              username: row.username as string,
              profileUrl: row.profileUrl as string,
            }));

    if (profiles.length === 0) {
      setError("No valid profiles to extract. Preview links first.");
      return;
    }

    setIsExtracting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/instagram-import/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profiles }),
      });

      const payload = (await response.json()) as {
        results?: InstagramSimpleExtractedRow[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Extraction failed.");
      }

      setResults(payload.results ?? []);
      setSuccessMessage(`Extracted ${payload.results?.length ?? 0} profile(s).`);
    } catch (extractError) {
      setError(getErrorMessage(extractError));
    } finally {
      setIsExtracting(false);
    }
  }

  function handleClear() {
    setInput("");
    setParseSummary(EMPTY_SUMMARY);
    setValidProfiles([]);
    setResults([]);
    setError(null);
    setSuccessMessage(null);
  }

  function handleExportCsv() {
    if (results.length === 0) return;
    const csv = buildInstagramSimpleImportCsv(results);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `instagram-import-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleSendToQueue() {
    if (results.length === 0) return;

    setIsQueueing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/instagram-import/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: results }),
      });

      const payload = (await response.json()) as {
        queued?: number;
        dataMode?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to send to Revit24 import queue.");
      }

      setSuccessMessage(
        `Sent ${payload.queued ?? 0} record(s) to Revit24 import queue (${payload.dataMode ?? "mock"} mode).`,
      );
    } catch (queueError) {
      setError(getErrorMessage(queueError));
    } finally {
      setIsQueueing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DataModeBadge dataMode={dataMode} firebaseConfigured={firebaseConfigured} />
        {!extractionLive ? (
          <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
            Mock extraction — set ENABLE_INSTAGRAM_EXTRACTION=true for live data
          </span>
        ) : null}
      </div>

      {!firebaseConfigured || dataMode === "mock" ? (
        <FirestoreStatusBanner
          variant="warning"
          title="Mock Mode"
          description={MOCK_MODE_WARNING}
        />
      ) : null}

      <InstagramImportForm
        value={input}
        onChange={setInput}
        onPreview={handlePreview}
        onExtract={handleExtract}
        onClear={handleClear}
        isExtracting={isExtracting}
        canExtract={input.trim().length > 0}
      />

      <InstagramImportSummary summary={summary} />

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {successMessage}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={handleExportCsv}
          disabled={results.length === 0}
        >
          <Download className="mr-2 size-4" />
          Export CSV
        </Button>
        <Button onClick={handleSendToQueue} disabled={results.length === 0 || isQueueing}>
          <Send className="mr-2 size-4" />
          {isQueueing ? "Sending..." : "Send to Revit24 Import Queue"}
        </Button>
      </div>

      <InstagramImportResultsTable
        rows={results}
        onRemove={(id) => setResults((current) => current.filter((row) => row.id !== id))}
      />
    </div>
  );
}
