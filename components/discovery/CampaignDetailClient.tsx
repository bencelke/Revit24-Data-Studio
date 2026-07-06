"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DiscoveryCampaignDetailData } from "@/lib/types/discovery-engine";
import {
  formatDiscoveryProvider,
  formatEntityType,
} from "@/lib/services/keywordGenerationService";
import { DiscoveryJobsTable } from "./DiscoveryJobsTable";
import { DiscoveryResultsTable } from "./DiscoveryResultsTable";
import { DiscoveryTimeline } from "./DiscoveryTimeline";

type CampaignDetailClientProps = DiscoveryCampaignDetailData;

export function CampaignDetailClient({
  campaign,
  jobs,
  results,
}: CampaignDetailClientProps) {
  const router = useRouter();
  const [running, setRunning] = useState(false);

  async function handleRun() {
    setRunning(true);
    try {
      const response = await fetch(`/api/discovery/campaigns/${campaign.id}/run`, {
        method: "POST",
      });
      if (response.ok) {
        router.refresh();
      }
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">{campaign.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {campaign.description ?? "No description"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize">
            {campaign.status}
          </Badge>
          <Button onClick={() => void handleRun()} disabled={running}>
            {running ? "Running…" : "Run Discovery"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border bg-card shadow-none">
          <CardHeader className="pb-2">
            <CardDescription>Provider</CardDescription>
            <CardTitle className="text-base">{formatDiscoveryProvider(campaign.provider)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border bg-card shadow-none">
          <CardHeader className="pb-2">
            <CardDescription>Location</CardDescription>
            <CardTitle className="text-base">
              {[campaign.city, campaign.country].filter(Boolean).join(", ") || "—"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border bg-card shadow-none">
          <CardHeader className="pb-2">
            <CardDescription>Keywords</CardDescription>
            <CardTitle className="text-base">{campaign.keywords.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border bg-card shadow-none">
          <CardHeader className="pb-2">
            <CardDescription>Results</CardDescription>
            <CardTitle className="text-base">{results.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-border bg-card shadow-none">
        <CardHeader>
          <CardTitle>Campaign Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Entity Types</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {campaign.entityTypes.map((type) => (
                <Badge key={type} variant="secondary">
                  {formatEntityType(type)}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Keywords</p>
            <p className="mt-1 text-muted-foreground">{campaign.keywords.join(" · ") || "—"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Hashtags</p>
            <p className="mt-1 text-muted-foreground">{campaign.hashtags.join(" ") || "—"}</p>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Jobs</h3>
        <DiscoveryJobsTable jobs={jobs} />
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Results</h3>
        <DiscoveryResultsTable results={results} />
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">History</h3>
        <DiscoveryTimeline jobs={jobs} />
      </section>
    </div>
  );
}
