import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout";
import { GooglePlacesPageNav, GooglePlacesResultsClient } from "@/components/google-places";
import { getPlacesResultsPageData } from "@/lib/services/placesSearchService";

export const metadata: Metadata = {
  title: "Google Places Results",
};

interface ResultsPageProps {
  searchParams: Promise<{ jobId?: string }>;
}

export default async function GooglePlacesResultsPage({ searchParams }: ResultsPageProps) {
  const { jobId } = await searchParams;
  if (!jobId) notFound();

  const data = await getPlacesResultsPageData(jobId);
  if (!data) notFound();

  return (
    <AppShell
      title="Search Results"
      description="Review discovered businesses before importing into the review workflow"
    >
      <div className="space-y-6">
        <GooglePlacesPageNav active="search" />
        <GooglePlacesResultsClient job={data.job} places={data.places} />
      </div>
    </AppShell>
  );
}
