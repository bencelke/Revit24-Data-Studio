"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { InstagramExtractorForm } from "./InstagramExtractorForm";
import { InstagramExtractorSummary } from "./InstagramExtractorSummary";
import { FirestoreStatusBanner } from "@/components/imports/DataModeBadge";
import { parseInstagramInput } from "@/lib/validation/instagramInput";
import { MOCK_MODE_WARNING, getErrorMessage } from "@/lib/errors/app-errors";
import type {
  ExtractorPageData,
  InstagramExtractionRunSummary,
  InstagramParseSummary,
} from "@/lib/types/instagramExtraction";
import { Badge } from "@/components/ui/badge";

const EMPTY_SUMMARY: InstagramParseSummary = {
  total: 0,
  valid: 0,
  duplicate: 0,
  invalid: 0,
};

type InstagramExtractorClientProps = ExtractorPageData;

export function InstagramExtractorClient({
  firebaseConnected,
  storageMode,
  extractorMode,
  extractionEnabled,
}: InstagramExtractorClientProps) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [summary, setSummary] = useState<InstagramParseSummary>(EMPTY_SUMMARY);
  const [validProfiles, setValidProfiles] = useState<
    { username: string; profileUrl: string }[]
  >([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runSummary, setRunSummary] = useState<InstagramExtractionRunSummary | null>(null);

  function handlePreview() {
    const parsed = parseInstagramInput(input);
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
    setRunSummary(null);
  }

  async function handleExtract() {
    const profiles =
      validProfiles.length > 0
        ? validProfiles
        : parseInstagramInput(input)
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
    setRunSummary(null);

    try {
      const response = await fetch("/api/instagram-extractor/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profiles }),
      });

      const payload = (await response.json()) as {
        summary?: InstagramExtractionRunSummary;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Extraction failed.");
      }

      if (payload.summary) {
        setRunSummary(payload.summary);
      }

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
    setRunSummary(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={storageMode === "live" ? "default" : "outline"}>
          {storageMode === "live" ? "Live Firestore" : "Mock storage"}
        </Badge>
        <Badge variant={extractorMode === "live" ? "default" : "outline"}>
          {extractorMode === "live" ? "Live extraction" : "Mock extraction"}
        </Badge>
        {!extractionEnabled ? (
          <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
            Set ENABLE_INSTAGRAM_EXTRACTION=true for live public profile data
          </span>
        ) : null}
      </div>

      {storageMode === "mock" ? (
        <FirestoreStatusBanner
          variant="warning"
          title="Mock Mode"
          description={MOCK_MODE_WARNING}
        />
      ) : (
        <FirestoreStatusBanner
          variant="success"
          title="Firebase Connected"
          description={
            firebaseConnected
              ? "Extracted profiles will be saved to the instagram_extractions collection."
              : undefined
          }
        />
      )}

      <InstagramExtractorForm
        value={input}
        onChange={setInput}
        onPreview={handlePreview}
        onExtract={handleExtract}
        onClear={handleClear}
        isExtracting={isExtracting}
        canExtract={input.trim().length > 0}
      />

      <InstagramExtractorSummary summary={summary} />

      {runSummary ? (
        <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          Saved {runSummary.saved} of {runSummary.total} profile(s) to {runSummary.storageMode} storage.
          {runSummary.duplicateSkipped > 0
            ? ` ${runSummary.duplicateSkipped} duplicate(s) skipped.`
            : null}
          {runSummary.failed > 0 ? ` ${runSummary.failed} failed.` : null}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}
    </div>
  );
}
