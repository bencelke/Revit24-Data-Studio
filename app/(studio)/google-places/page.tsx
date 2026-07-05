import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/layout";
import { GooglePlacesPageNav } from "@/components/google-places";
import { Button } from "@/components/ui/button";
import { getPlacesSearchPageData } from "@/lib/services/placesSearchService";

export const metadata: Metadata = {
  title: "Google Places",
};

export default async function GooglePlacesHubPage() {
  const data = await getPlacesSearchPageData();

  return (
    <AppShell
      title="Google Places Discovery"
      description="Discover automotive businesses via Google Places and import into the review workflow"
    >
      <div className="space-y-6">
        <GooglePlacesPageNav active="hub" />
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Business Discovery Center</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Search for performance shops, detailers, wrap studios, and other automotive businesses.
            Results enter the Revit24 review workflow after import — no automatic approvals.
          </p>
          {!data.googlePlacesConfigured ? (
            <p className="mt-3 text-sm text-amber-400">
              Google Places API Not Configured — running entirely in Mock Mode with realistic sample data.
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button nativeButton={false} render={<Link href="/google-places/search" />}>
              Start Search
            </Button>
            <Button variant="secondary" nativeButton={false} render={<Link href="/google-places/jobs" />}>
              View Jobs
            </Button>
            <Button variant="outline" nativeButton={false} render={<Link href="/imports/google-places" />}>
              Import Center Entry
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
