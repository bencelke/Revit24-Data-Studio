"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Link from "next/link";
import { DataModeBadge, FirestoreStatusBanner } from "@/components/imports/DataModeBadge";
import { WebsiteSummaryCards } from "./WebsiteSummaryCards";
import { DiscoveryJobCard } from "./DiscoveryJobCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MOCK_MODE_WARNING } from "@/lib/errors/app-errors";
import { parseWebsiteInput } from "@/lib/services/websiteDiscoveryService";
import type { WebsitesHubPageData } from "@/lib/types/websites";
import type { WebsiteDiscoveryInput } from "@/lib/types/website-discovery";
import type { ImportDataMode } from "@/lib/types/import-jobs";

interface WebsiteDiscoveryClientProps extends WebsitesHubPageData {
  dataMode: ImportDataMode;
}

export function WebsiteDiscoveryClient({
  jobs,
  dataMode,
  firebaseConfigured,
  workerAvailable,
  warning,
}: WebsiteDiscoveryClientProps) {
  const router = useRouter();
  const [inputType, setInputType] = useState<WebsiteDiscoveryInput["inputType"]>("bulk");
  const [text, setText] = useState("");
  const [respectRobotsTxt, setRespectRobotsTxt] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const recentJobs = jobs.slice(0, 6);

  const parsedPreview = useMemo(() => parseWebsiteInput(text, inputType), [text, inputType]);

  function handlePreview() {
    setPreviewUrls(parsedPreview);
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      const urls = parsedPreview.length > 0 ? parsedPreview : parseWebsiteInput(text, inputType);
      const response = await fetch("/api/websites/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputType, urls, respectRobotsTxt }),
      });
      if (response.ok) {
        const data = (await response.json()) as { jobId: string };
        router.push(`/websites/results?jobId=${data.jobId}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCsvUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setInputType("csv");
      setText(String(reader.result ?? ""));
    };
    reader.readAsText(file);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DataModeBadge dataMode={dataMode} firebaseConfigured={firebaseConfigured} />
        {!workerAvailable ? (
          <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
            Worker Not Running — Mock Mode
          </span>
        ) : null}
      </div>

      {!firebaseConfigured ? (
        <FirestoreStatusBanner variant="warning" title="Mock Mode" description={MOCK_MODE_WARNING} />
      ) : warning ? (
        <FirestoreStatusBanner variant="warning" title={workerAvailable ? "Mock Data" : "Worker Not Running"} description={warning} />
      ) : null}

      <WebsiteSummaryCards
        totalJobs={jobs.length}
        completedJobs={jobs.filter((job) => job.status === "completed").length}
        totalWebsites={jobs.reduce((sum, job) => sum + job.successfulUrls, 0)}
        importedWebsites={0}
      />

      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold">Website Discovery</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Paste URLs, upload a CSV, or enter domains. Only public metadata is collected.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(["single", "bulk", "domain", "csv"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setInputType(type)}
              className={`rounded-md px-3 py-1.5 text-sm capitalize ${inputType === type ? "bg-brand text-white" : "bg-muted text-muted-foreground"}`}
            >
              {type === "csv" ? "CSV" : type}
            </button>
          ))}
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            inputType === "domain"
              ? "example.com\nanother-shop.de"
              : inputType === "csv"
                ? "Paste CSV content or upload a file below"
                : "https://example.com\nhttps://another-shop.de"
          }
          rows={6}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={respectRobotsTxt}
              onChange={(e) => setRespectRobotsTxt(e.target.checked)}
              className="size-4 accent-brand"
            />
            Respect robots.txt
          </label>
          <Input type="file" accept=".csv,text/csv" onChange={handleCsvUpload} className="max-w-xs" />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handlePreview}>
            Preview ({parsedPreview.length} URLs)
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={isSubmitting || parsedPreview.length === 0}>
            {isSubmitting ? "Creating job..." : "Create Discovery Job"}
          </Button>
        </div>

        {previewUrls.length > 0 ? (
          <div className="rounded-md border border-border bg-muted/20 p-3">
            <p className="text-xs font-medium text-muted-foreground">Preview</p>
            <ul className="mt-2 max-h-32 overflow-y-auto text-sm">
              {previewUrls.slice(0, 20).map((url) => (
                <li key={url} className="truncate">{url}</li>
              ))}
              {previewUrls.length > 20 ? (
                <li className="text-muted-foreground">+{previewUrls.length - 20} more</li>
              ) : null}
            </ul>
          </div>
        ) : null}
      </div>

      {recentJobs.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Recent Discovery Jobs</h3>
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/websites/jobs" />}>
              View all
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {recentJobs.map((job) => (
              <DiscoveryJobCard key={job.id} job={job} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
