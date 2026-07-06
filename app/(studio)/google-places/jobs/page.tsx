import type { Metadata } from "next";
import { AppShell } from "@/components/layout";
import { GooglePlacesPageNav } from "@/components/google-places";
import { GoogleSummaryCards, GooglePlacesJobsClient } from "@/components/google";
import { getPlacesJobsPageData } from "@/lib/services/placesSearchService";

export const metadata: Metadata = {
  title: "Google Places Jobs",
};

export default async function GooglePlacesJobsPage() {
  const data = await getPlacesJobsPageData();

  return (
    <AppShell
      title="Search Jobs"
      description="History of Google Places discovery searches"
    >
      <div className="space-y-6">
        <GooglePlacesPageNav active="jobs" />
        <GoogleSummaryCards
          totalJobs={data.jobs.length}
          completedJobs={data.jobs.filter((job) => job.status === "completed").length}
          totalPlaces={data.jobs.reduce((sum, job) => sum + job.totalResults, 0)}
          importedPlaces={data.jobs.reduce((sum, job) => sum + job.importedResults, 0)}
        />
        <GooglePlacesJobsClient jobs={data.jobs} />
      </div>
    </AppShell>
  );
}
