"use client";

import { useState } from "react";
import Link from "next/link";
import { InstagramExtractorForm } from "./InstagramExtractorForm";
import { InstagramExtractorSummary } from "./InstagramExtractorSummary";
import { InstagramExtractorStatusPanel } from "./InstagramExtractorStatusPanel";
import { FirestoreStatusBanner } from "@/components/imports/DataModeBadge";
import { Button } from "@/components/ui/button";
import { useFirebaseAuth } from "@/components/providers/FirebaseAuthProvider";
import { parseInstagramInput } from "@/lib/validation/instagramInput";
import {
  buildInstagramQueueDocumentId,
  INSTAGRAM_QUEUE_PLATFORM,
  INSTAGRAM_QUEUE_SOURCE,
} from "@/lib/types/instagramExtractionQueue";
import {
  createLocalQueueItems,
  saveQueueItems,
} from "@/lib/repositories/instagramExtractionQueueStorage";
import { enqueueInstagramProfiles } from "@/lib/services/instagramExtractionQueueService";
import {
  FirebaseAuthRequiredError,
  FirebaseInitError,
  FirebaseNotConfiguredError,
  formatInstagramQueueSuccessMessage,
  getInstagramQueueErrorMessage,
  MOCK_MODE_WARNING,
} from "@/lib/errors/app-errors";
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
  firebaseProjectId,
}: InstagramExtractorClientProps) {
  const { user, loading: authLoading, isClientReady, envStatus, initError } = useFirebaseAuth();
  const [input, setInput] = useState("");
  const [summary, setSummary] = useState<InstagramParseSummary>(EMPTY_SUMMARY);
  const [validProfiles, setValidProfiles] = useState<
    { username: string; profileUrl: string }[]
  >([]);
  const [isQueueing, setIsQueueing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
    setSuccessMessage(null);
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
    setSuccessMessage(null);

    try {
      if (storageMode === "mock") {
        const timestamp = new Date().toISOString();
        const inputs = profiles.map((profile) => {
          const username = profile.username.toLowerCase();
          return {
            id: buildInstagramQueueDocumentId(username),
            source: INSTAGRAM_QUEUE_SOURCE,
            sourcePlatform: INSTAGRAM_QUEUE_PLATFORM,
            username,
            profileUrl: profile.profileUrl,
            status: "queued" as const,
            createdAt: timestamp,
            updatedAt: timestamp,
            startedAt: "",
            completedAt: "",
            attempts: 0,
            errorCode: "",
            errorMessage: "",
          };
        });
        const records = createLocalQueueItems(inputs);
        saveQueueItems(records);
        const result: InstagramQueueJobSummary = {
          queued: records.length,
          skipped: 0,
          storageMode: "mock",
        };
        setSuccessMessage(formatInstagramQueueSuccessMessage(result.queued, result.skipped));
        setSummary((current) => ({ ...current, queued: result.queued }));
        return;
      }

      if (!envStatus.configured) {
        throw new FirebaseNotConfiguredError(envStatus.missingKeys);
      }

      if (initError) {
        throw new FirebaseInitError(initError);
      }

      if (!isClientReady) {
        throw new FirebaseInitError();
      }

      if (authLoading) {
        setError("Checking Firebase sign-in status. Try again in a moment.");
        return;
      }

      if (!user) {
        throw new FirebaseAuthRequiredError();
      }

      const result = await enqueueInstagramProfiles(profiles);
      const queuedCount = result.summary.queued;

      setSuccessMessage(
        formatInstagramQueueSuccessMessage(result.summary.queued, result.summary.skipped),
      );

      if (queuedCount > 0) {
        setSummary((current) => ({ ...current, queued: queuedCount }));
      }
    } catch (queueError) {
      console.error("[instagram-extractor] Queue write failed:", queueError);
      setError(getInstagramQueueErrorMessage(queueError));
    } finally {
      setIsQueueing(false);
    }
  }

  function handleClear() {
    setInput("");
    setSummary(EMPTY_SUMMARY);
    setValidProfiles([]);
    setError(null);
    setSuccessMessage(null);
  }

  return (
    <div className="space-y-6">
      <InstagramExtractorStatusPanel
        storageMode={storageMode}
        firebaseProjectId={firebaseProjectId}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={storageMode === "firebase" ? "default" : "outline"}>
          {storageMode === "firebase" ? "Firebase Connected" : "Mock localStorage"}
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
              ? "Profiles are queued in instagram_extraction_queue. Sign in with an approved email before creating jobs."
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
        successMessage={successMessage}
        errorMessage={error}
      />

      <InstagramExtractorSummary summary={summary} />

      {successMessage ? (
        <div className="space-y-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
            {successMessage}
          </p>
          <p className="text-sm text-muted-foreground">
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
          {storageMode === "firebase" && !user && !authLoading ? (
            <div className="mt-3">
              <Button nativeButton={false} render={<Link href="/login" />} size="sm" variant="outline">
                Sign in to Firebase
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
