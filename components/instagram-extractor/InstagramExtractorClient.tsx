"use client";

import { useState } from "react";
import Link from "next/link";
import { InstagramExtractorForm } from "./InstagramExtractorForm";
import { InstagramExtractorSummary } from "./InstagramExtractorSummary";
import { FirestoreStatusBanner } from "@/components/imports/DataModeBadge";
import { Button } from "@/components/ui/button";
import { parseInstagramInput } from "@/lib/validation/instagramInput";
import {
  createLocalQueueItems,
  saveQueueItems,
  usesLocalQueueStorage,
} from "@/lib/repositories/instagramExtractionQueueStorage";
import { MOCK_MODE_WARNING, getErrorMessage } from "@/lib/errors/app-errors";
import type { ExtractorPageData, InstagramParseSummary } from "@/lib/types/instagramExtraction";
import type { InstagramQueueJobSummary } from "@/lib/types/instagramExtractionQueue";
import { Badge } from "@/components/ui/badge";

const EMPTY_SUMMARY: InstagramParseSummary = {
  total: 0,
  valid: 0,
  duplicate: 0,
  invalid: 0,
  queued: 0,
};

type InstagramExtractorClientProps = ExtractorPageData;

export function InstagramExtractorClient({
  firebaseConnected,
  storageMode,
}: InstagramExtractorClientProps) {
  const [input, setInput] = useState("");
  const [summary, setSummary] = useState<InstagramParseSummary>(EMPTY_SUMMARY);
  const [validProfiles, setValidProfiles] = useState<
    { username: string; profileUrl: string }[]
  >([]);
  const [isQueueing, setIsQueueing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queueSummary, setQueueSummary] = useState<InstagramQueueJobSummary | null>(null);

  function handlePreview() {
    const parsed = parseInstagramInput(input);
    setSummary({ ...parsed.summary, queued: summary.queued ?? 0 });
    setValidProfiles(
      parsed.rows
        .filter((row) => row.validationStatus === "valid" && row.username && row.profileUrl)
        .map((row) => ({
          username: row.username as string,
          profileUrl: row.profileUrl as string,
        })),
    );
    setError(null);
    setQueueSummary(null);
  }

  function resolveProfiles(): { username: string; profileUrl: string }[] {
    if (validProfiles.length > 0) {
      return validProfiles;
    }

    const parsed = parseInstagramInput(input);
    setSummary({ ...parsed.summary, queued: summary.queued ?? 0 });
    const profiles = parsed.rows
      .filter((row) => row.validationStatus === "valid" && row.username && row.profileUrl)
      .map((row) => ({
        username: row.username as string,
        profileUrl: row.profileUrl as string,
      }));
    setValidProfiles(profiles);
    return profiles;
  }

  async function handleCreateJob() {
    const profiles = resolveProfiles();

    if (profiles.length === 0) {
      setError("No valid profiles to queue. Check your input.");
      return;
    }

    setIsQueueing(true);
    setError(null);
    setQueueSummary(null);

    try {
      if (usesLocalQueueStorage()) {
        const timestamp = new Date().toISOString();
        const inputs = profiles.map((profile) => ({
          username: profile.username.toLowerCase(),
          profileUrl: profile.profileUrl,
          status: "pending" as const,
          createdAt: timestamp,
          updatedAt: timestamp,
          startedAt: null,
          completedAt: null,
          attempts: 0,
          errorCode: null,
          errorMessage: null,
        }));
        const records = createLocalQueueItems(inputs);
        saveQueueItems(records);
        const result: InstagramQueueJobSummary = {
          queued: records.length,
          skipped: 0,
          storageMode: "mock",
        };
        setQueueSummary(result);
        setSummary((current) => ({ ...current, queued: result.queued }));
        return;
      }

      const response = await fetch("/api/instagram-extractor/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profiles }),
      });

      const payload = (await response.json()) as {
        summary?: InstagramQueueJobSummary;
        error?: string;
      };

      if (!response.ok || !payload.summary) {
        throw new Error(payload.error ?? "Failed to create extraction job.");
      }

      setQueueSummary(payload.summary);
      setSummary((current) => ({ ...current, queued: payload.summary?.queued ?? 0 }));
    } catch (queueError) {
      setError(getErrorMessage(queueError));
    } finally {
      setIsQueueing(false);
    }
  }

  function handleClear() {
    setInput("");
    setSummary(EMPTY_SUMMARY);
    setValidProfiles([]);
    setError(null);
    setQueueSummary(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={storageMode === "live" ? "default" : "outline"}>
          {storageMode === "live" ? "Firebase Live Mode" : "Mock localStorage"}
        </Badge>
        <Badge variant="outline">Local worker extraction</Badge>
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
              ? "Profiles are queued in instagram_extraction_queue. Run npm run worker:instagram on your Mac to process them."
              : undefined
          }
        />
      )}

      <InstagramExtractorForm
        value={input}
        onChange={setInput}
        onPreview={handlePreview}
        onCreateJob={handleCreateJob}
        onClear={handleClear}
        isQueueing={isQueueing}
        canCreateJob={input.trim().length > 0}
      />

      <InstagramExtractorSummary summary={summary} />

      {queueSummary ? (
        <div className="space-y-3 rounded-lg border border-border bg-card px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Queued {queueSummary.queued} profile{queueSummary.queued === 1 ? "" : "s"}.
            {queueSummary.skipped > 0
              ? ` ${queueSummary.skipped} already pending and skipped.`
              : null}{" "}
            Run the local worker to process them.
          </p>
          <p className="font-mono text-xs text-muted-foreground">npm run worker:instagram</p>
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
