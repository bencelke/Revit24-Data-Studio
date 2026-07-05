import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/layout";
import { GooglePlacesPageNav, PlacesSummaryCards } from "@/components/google-places";
import { Button } from "@/components/ui/button";
import { getPlacesJobsPageData } from "@/lib/services/placesSearchService";
import { formatImportDate } from "@/lib/services/importService";

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
        <PlacesSummaryCards
          totalJobs={data.jobs.length}
          completedJobs={data.jobs.filter((job) => job.status === "completed").length}
          totalPlaces={data.jobs.reduce((sum, job) => sum + job.totalResults, 0)}
          importedPlaces={data.jobs.reduce((sum, job) => sum + job.importedResults, 0)}
        />
        <div className="rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="p-3">Query</th>
                <th className="p-3">Status</th>
                <th className="p-3">Results</th>
                <th className="p-3">Created</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.jobs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted-foreground">
                    No search jobs yet.
                  </td>
                </tr>
              ) : (
                data.jobs.map((job) => (
                  <tr key={job.id} className="border-b border-border last:border-0">
                    <td className="p-3">
                      {[job.query.keyword, job.query.category, job.query.city, job.query.country]
                        .filter(Boolean)
                        .join(" · ") || "Search"}
                    </td>
                    <td className="p-3">{job.status}</td>
                    <td className="p-3">{job.totalResults}</td>
                    <td className="p-3">{formatImportDate(job.createdAt)}</td>
                    <td className="p-3">
                      <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`/google-places/results?jobId=${job.id}`} />}>
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
