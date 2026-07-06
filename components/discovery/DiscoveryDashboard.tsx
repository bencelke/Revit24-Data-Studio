"use client";

import { DataModeBadge, FirestoreStatusBanner } from "@/components/imports/DataModeBadge";
import { MOCK_MODE_WARNING } from "@/lib/errors/app-errors";
import type { DiscoveryDashboardData } from "@/lib/types/discovery-engine";
import { DiscoverySummaryCards } from "./DiscoverySummaryCards";
import { CampaignCard } from "./CampaignCard";
import { DiscoveryJobsTable } from "./DiscoveryJobsTable";
import { DiscoveryResultsTable } from "./DiscoveryResultsTable";

type DiscoveryDashboardProps = DiscoveryDashboardData;

export function DiscoveryDashboard({
  stats,
  recentCampaigns,
  recentJobs,
  recentResults,
  dataMode,
  firebaseConfigured,
  warning,
}: DiscoveryDashboardProps) {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DataModeBadge dataMode={dataMode} firebaseConfigured={firebaseConfigured} />
      </div>
      {!firebaseConfigured ? (
        <FirestoreStatusBanner variant="warning" title="Mock Mode" description={MOCK_MODE_WARNING} />
      ) : warning ? (
        <FirestoreStatusBanner variant="warning" title="Mock Data" description={warning} />
      ) : null}

      <DiscoverySummaryCards stats={stats} />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Recent Campaigns</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recentCampaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Discovery Jobs</h2>
        <DiscoveryJobsTable jobs={recentJobs} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Latest Results</h2>
        <DiscoveryResultsTable results={recentResults} />
      </section>
    </div>
  );
}
