import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout";
import { WebsitePageNav, WebsiteResultsClient } from "@/components/websites";
import { DataModeBadge, FirestoreStatusBanner } from "@/components/imports/DataModeBadge";
import { getWebsiteResultsPageData } from "@/lib/services/websiteDiscoveryService";
import { MOCK_MODE_WARNING } from "@/lib/errors/app-errors";

export const metadata: Metadata = {
  title: "Website Discovery Results",
};

interface ResultsPageProps {
  searchParams: Promise<{ jobId?: string }>;
}

export default async function WebsiteResultsPage({ searchParams }: ResultsPageProps) {
  const { jobId } = await searchParams;
  if (!jobId) notFound();

  const data = await getWebsiteResultsPageData(jobId);
  if (!data) notFound();

  return (
    <AppShell
      title="Discovery Results"
      description="Review extracted website metadata before importing into the review workflow"
    >
      <div className="space-y-6">
        <WebsitePageNav active="discover" />
        <div className="flex flex-wrap items-center gap-3">
          <DataModeBadge dataMode={data.dataMode} firebaseConfigured={data.firebaseConfigured} />
          {!data.workerAvailable ? (
            <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
              Worker Not Running — Mock Mode
            </span>
          ) : null}
        </div>
        {!data.firebaseConfigured ? (
          <FirestoreStatusBanner variant="warning" title="Mock Mode" description={MOCK_MODE_WARNING} />
        ) : null}
        <WebsiteResultsClient job={data.job} websites={data.websites} />
      </div>
    </AppShell>
  );
}
