"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DataModeBadge, FirestoreStatusBanner } from "@/components/imports/DataModeBadge";
import { InstagramImportForm } from "./InstagramImportForm";
import { InstagramImportSummary } from "./InstagramImportSummary";
import { parseSimpleInstagramInput } from "@/lib/validation/simpleInstagramInput";
import { saveSimpleImportResults } from "@/lib/utils/simpleImportStorage";
import { MOCK_MODE_WARNING, getErrorMessage } from "@/lib/errors/app-errors";
import type { SimpleExtractedProfile, SimpleImportPageData, SimpleParseSummary } from "@/lib/types/simpleInstagramImport";

const EMPTY_SUMMARY: SimpleParseSummary = {
  total: 0,
  valid: 0,
  duplicate: 0,
  invalid: 0,
};

type InstagramImportClientProps = SimpleImportPageData;

export function InstagramImportClient({
  firebaseConfigured,
  dataMode,
  extractionLive,
}: InstagramImportClientProps) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [summary, setSummary] = useState<SimpleParseSummary>(EMPTY_SUMMARY);
  const [validProfiles, setValidProfiles] = useState<
    { username: string; profileUrl: string }[]
  >([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handlePreview() {
    const parsed = parseSimpleInstagramInput(input);
    setSummary(parsed.summary);
    setValidProfiles(
      parsed.rows
        .filter((row) => row.validationStatus === "valid" && row.username && row.profileUrl)
        .map((row) => ({
          username: row.username as string,
          profileUrl: row.profileUrl as string,
        })),
    );
    setError(null);
  }

  async function handleExtract() {
    const profiles =
      validProfiles.length > 0
        ? validProfiles
        : parseSimpleInstagramInput(input)
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

    try {
      const response = await fetch("/api/instagram-import/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profiles }),
      });

      const payload = (await response.json()) as {
        results?: SimpleExtractedProfile[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Extraction failed.");
      }

      saveSimpleImportResults(payload.results ?? []);
      router.push("/results");
    } catch (extractError) {
      setError(getErrorMessage(extractError));
    } finally {
      setIsExtracting(false);
    }
  }

  function handleClear() {
    setInput("");
    setSummary(EMPTY_SUMMARY);
    setValidProfiles([]);
    setError(null);
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

      {dataMode === "mock" ? (
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
    </div>
  );
}
