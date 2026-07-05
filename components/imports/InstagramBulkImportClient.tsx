"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InstagramBulkInput } from "./InstagramBulkInput";
import { InstagramPreviewTable } from "./InstagramPreviewTable";
import { ImportPreviewSummary } from "./ImportPreviewSummary";
import { FirestoreStatusBanner } from "./DataModeBadge";
import { parseInstagramBulkInput } from "@/lib/validation/instagramProfileInput";
import { isInstagramImportFirestoreAvailable } from "@/lib/services/instagramProfileImportService";
import type { InstagramProfileBulkParseResult } from "@/lib/types/instagram-imports";

export function InstagramBulkImportClient() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [parseResult, setParseResult] =
    useState<InstagramProfileBulkParseResult | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const firebaseConfigured = isInstagramImportFirestoreAvailable();

  function handlePreview() {
    setParseResult(parseInstagramBulkInput(input));
    setError(null);
    setSuccessMessage(null);
    setWarningMessage(null);
  }

  async function handleCreateJob() {
    if (!parseResult) return;

    setIsCreating(true);
    setError(null);
    setSuccessMessage(null);
    setWarningMessage(null);

    try {
      const response = await fetch("/api/import-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });

      const payload = (await response.json()) as {
        job?: { id: string; name: string; status: string };
        warning?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to create import job.");
      }

      if (payload.warning) {
        setWarningMessage(payload.warning);
      }

      if (payload.job) {
        setSuccessMessage(
          `Import job "${payload.job.name}" created successfully.`,
        );
        router.push(`/imports/${payload.job.id}`);
        return;
      }

      throw new Error("Import job response was missing job data.");
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Failed to create import job.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        {!firebaseConfigured ? (
          <FirestoreStatusBanner
            variant="warning"
            title="Firestore Not Configured"
            description="Import jobs will be saved locally only and will not persist after restart. Add Firebase credentials to .env.local for Firestore persistence."
          />
        ) : (
          <FirestoreStatusBanner
            variant="info"
            title="Firestore Persistence Enabled"
            description="Import jobs and normalized records will be saved to Firestore import_jobs and import_records collections."
          />
        )}

        {error ? (
          <FirestoreStatusBanner
            variant="error"
            title="Import job failed"
            description={error}
          />
        ) : null}

        {warningMessage ? (
          <FirestoreStatusBanner
            variant="warning"
            title="Mock Data Mode"
            description={warningMessage}
          />
        ) : null}

        {successMessage ? (
          <FirestoreStatusBanner
            variant="success"
            title="Import job created"
            description={successMessage}
          />
        ) : null}

        <InstagramBulkInput
          value={input}
          onChange={setInput}
          onPreview={handlePreview}
          onCreateJob={handleCreateJob}
          isPreviewReady={parseResult !== null}
          isCreating={isCreating}
        />

        {parseResult ? (
          <div className="space-y-3">
            <div>
              <h3 className="text-base font-semibold">Preview</h3>
              <p className="text-sm text-muted-foreground">
                Review normalized usernames before creating the import job.
                Existing database duplicates are checked when the job is created.
              </p>
            </div>
            <InstagramPreviewTable rows={parseResult.rows} />
          </div>
        ) : null}
      </div>

      <div className="space-y-4">
        <ImportPreviewSummary summary={parseResult?.summary ?? null} />

        <Card className="border-border bg-card shadow-none">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Allowed metadata
            </CardTitle>
            <CardDescription>
              Future worker phase — public fields only
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li>Instagram username</li>
              <li>Display name</li>
              <li>Profile URL</li>
              <li>Profile image URL</li>
              <li>Bio text if visible</li>
              <li>External website if visible</li>
              <li>Public email only if visible in bio</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
