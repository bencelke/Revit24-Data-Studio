"use client";

import { useState } from "react";
import Link from "next/link";
import { InstagramExtractorForm } from "./InstagramExtractorForm";
import { InstagramExtractorSummary } from "./InstagramExtractorSummary";
import { InstagramExtractionProgressPanel } from "./InstagramExtractionProgressPanel";
import { FirestoreStatusBanner } from "@/components/imports/DataModeBadge";
import { Button } from "@/components/ui/button";
import { parseInstagramInput } from "@/lib/validation/instagramInput";
import {
  listExtractionResultsSync,
  saveExtractionResults,
  usesLocalStorage,
} from "@/lib/repositories/instagramExtractionStorage";
import { MOCK_MODE_WARNING, getErrorMessage } from "@/lib/errors/app-errors";
import type {
  ExtractedInstagramProfile,
  ExtractorPageData,
  InstagramExtractionProgress,
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

const EMPTY_PROGRESS: InstagramExtractionProgress = {
  current: 0,
  total: 0,
  username: "",
  succeeded: 0,
  failed: 0,
  statusMessage: "",
};

type InstagramExtractorClientProps = ExtractorPageData;

export function InstagramExtractorClient({
  firebaseConnected,
  storageMode,
  extractorMode,
  extractionEnabled,
  extractionDelayMs,
}: InstagramExtractorClientProps) {
  const [input, setInput] = useState("");
  const [summary, setSummary] = useState<InstagramParseSummary>(EMPTY_SUMMARY);
  const [validProfiles, setValidProfiles] = useState<
    { username: string; profileUrl: string }[]
  >([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runSummary, setRunSummary] = useState<InstagramExtractionRunSummary | null>(null);
  const [progress, setProgress] = useState<InstagramExtractionProgress>(EMPTY_PROGRESS);

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
    setProgress(EMPTY_PROGRESS);
  }

  function resolveProfiles(): { username: string; profileUrl: string }[] {
    if (validProfiles.length > 0) {
      return validProfiles;
    }

    const parsed = parseInstagramInput(input);
    setSummary(parsed.summary);
    const profiles = parsed.rows
      .filter((row) => row.validationStatus === "valid" && row.username && row.profileUrl)
      .map((row) => ({
        username: row.username as string,
        profileUrl: row.profileUrl as string,
      }));
    setValidProfiles(profiles);
    return profiles;
  }

  async function handleExtract() {
    const profiles = resolveProfiles();

    if (profiles.length === 0) {
      setError("No valid profiles to extract. Check your input.");
      return;
    }

    setIsExtracting(true);
    setError(null);
    setRunSummary(null);

    let succeeded = 0;
    let failed = 0;
    let saved = 0;
    let updated = 0;

    try {
      for (let index = 0; index < profiles.length; index += 1) {
        const profile = profiles[index];
        setProgress({
          current: index + 1,
          total: profiles.length,
          username: profile.username,
          succeeded,
          failed,
          statusMessage: `Extracting @${profile.username}...`,
        });

        const response = await fetch("/api/instagram-extractor/extract-one", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile }),
        });

        const payload = (await response.json()) as {
          record?: ExtractedInstagramProfile;
          updated?: boolean;
          error?: string;
        };

        if (!response.ok || !payload.record) {
          failed += 1;
          setProgress((current) => ({
            ...current,
            failed,
            statusMessage: payload.error ?? `Failed to extract @${profile.username}.`,
          }));
          continue;
        }

        if (usesLocalStorage()) {
          const hadExisting = listExtractionResultsSync().some(
            (row) => row.username.toLowerCase() === payload.record!.username.toLowerCase(),
          );
          saveExtractionResults([payload.record]);
          if (hadExisting) {
            updated += 1;
          } else {
            saved += 1;
          }
        } else if (payload.updated) {
          updated += 1;
        } else {
          saved += 1;
        }

        if (payload.record.status === "completed" || payload.record.status === "mock") {
          succeeded += 1;
        } else {
          failed += 1;
        }

        setProgress({
          current: index + 1,
          total: profiles.length,
          username: profile.username,
          succeeded,
          failed,
          statusMessage:
            payload.record.status === "failed"
              ? `@${profile.username}: ${payload.record.error ?? "Extraction failed."}`
              : `Saved @${profile.username}`,
        });

        if (index < profiles.length - 1 && extractionDelayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, extractionDelayMs));
        }
      }

      const finalSummary: InstagramExtractionRunSummary = {
        total: profiles.length,
        succeeded,
        failed,
        saved,
        updated,
        storageMode,
      };

      setRunSummary(finalSummary);
      setProgress({
        current: profiles.length,
        total: profiles.length,
        username: profiles[profiles.length - 1]?.username ?? "",
        succeeded,
        failed,
        statusMessage: `Finished. ${succeeded} succeeded, ${failed} failed.`,
      });
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
    setProgress(EMPTY_PROGRESS);
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
            Set ENABLE_INSTAGRAM_EXTRACTION=true for real public profile data
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
              ? "Extracted profiles are saved to the instagram_extractions collection."
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

      {isExtracting || progress.current > 0 ? (
        <InstagramExtractionProgressPanel progress={progress} isRunning={isExtracting} />
      ) : null}

      {runSummary ? (
        <div className="space-y-3 rounded-lg border border-border bg-card px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Extraction complete: {runSummary.succeeded} succeeded, {runSummary.failed} failed.
            {runSummary.saved > 0 ? ` ${runSummary.saved} new record(s) saved.` : null}
            {runSummary.updated > 0 ? ` ${runSummary.updated} record(s) updated.` : null}
          </p>
          <Button nativeButton={false} render={<Link href="/results" />}>
            View Results
          </Button>
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
