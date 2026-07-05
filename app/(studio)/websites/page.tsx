import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/layout";
import { WebsitePageNav } from "@/components/websites";
import { Button } from "@/components/ui/button";
import { getWebsitesHubPageData } from "@/lib/services/websiteDiscoveryService";

export const metadata: Metadata = {
  title: "Websites",
};

export default async function WebsitesHubPage() {
  const data = await getWebsitesHubPageData();

  return (
    <AppShell
      title="Website Discovery"
      description="Discover and import public metadata from automotive websites"
    >
      <div className="space-y-6">
        <WebsitePageNav active="hub" />
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Public Website Metadata</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Collect publicly available website metadata — titles, contact details, social links, and
            business information. No authentication bypass. Respects robots.txt when configured.
          </p>
          {!data.workerAvailable ? (
            <p className="mt-3 text-sm text-amber-400">
              Worker Not Running — extraction uses Mock Mode with realistic sample data.
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button nativeButton={false} render={<Link href="/imports/websites" />}>
              Start Discovery
            </Button>
            <Button variant="secondary" nativeButton={false} render={<Link href="/websites/jobs" />}>
              View Jobs
            </Button>
            <Button variant="outline" nativeButton={false} render={<Link href="/imports/websites" />}>
              Import Center Entry
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
