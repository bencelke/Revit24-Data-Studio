"use client";

import { useState } from "react";
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
import { parseInstagramBulkInput } from "@/lib/validation/instagramProfileInput";
import { createInstagramProfileImportJob } from "@/lib/services/instagramProfileImportService";
import type { InstagramProfileBulkParseResult } from "@/lib/types/instagram-imports";

export function InstagramBulkImportClient() {
  const [input, setInput] = useState("");
  const [parseResult, setParseResult] =
    useState<InstagramProfileBulkParseResult | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createdJob, setCreatedJob] = useState<{
    id: string;
    name: string;
    status: string;
  } | null>(null);

  function handlePreview() {
    setParseResult(parseInstagramBulkInput(input));
    setCreatedJob(null);
  }

  function handleCreateJob() {
    if (!parseResult) return;

    setIsCreating(true);

    const jobName =
      parseResult.summary.validProfiles > 0
        ? `Instagram Profiles — ${parseResult.summary.validProfiles} links`
        : "Instagram Profiles — Draft";

    const job = createInstagramProfileImportJob(jobName, parseResult);
    setCreatedJob({ id: job.id, name: job.name, status: job.status });
    setIsCreating(false);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
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
                Review normalized usernames before creating the import job
              </p>
            </div>
            <InstagramPreviewTable rows={parseResult.rows} />
          </div>
        ) : null}

        {createdJob ? (
          <Card className="border-emerald-500/30 bg-emerald-500/5 shadow-none">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Import job created
              </CardTitle>
              <CardDescription>
                {createdJob.name} ({createdJob.id}) — status:{" "}
                {createdJob.status}. Stored locally until Firestore persistence
                is enabled.
              </CardDescription>
            </CardHeader>
          </Card>
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
