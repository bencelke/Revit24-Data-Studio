import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/layout";
import { WebsitePageNav, WebsiteSummaryCards } from "@/components/websites";
import { Button } from "@/components/ui/button";
import { getWebsitesHubPageData } from "@/lib/services/websiteDiscoveryService";
import { formatImportDate } from "@/lib/services/importService";

export const metadata: Metadata = {
  title: "Website Discovery Jobs",
};

export default async function WebsiteJobsPage() {
  const data = await getWebsitesHubPageData();

  return (
    <AppShell
      title="Discovery Jobs"
      description="History of website discovery and metadata extraction jobs"
    >
      <div className="space-y-6">
        <WebsitePageNav active="jobs" />
        <WebsiteSummaryCards
          totalJobs={data.jobs.length}
          completedJobs={data.jobs.filter((job) => job.status === "completed").length}
          totalWebsites={data.jobs.reduce((sum, job) => sum + job.successfulUrls, 0)}
          importedWebsites={0}
        />
        <div className="rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="p-3">Input</th>
                <th className="p-3">Status</th>
                <th className="p-3">URLs</th>
                <th className="p-3">Success</th>
                <th className="p-3">Created</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.jobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-muted-foreground">
                    No discovery jobs yet.
                  </td>
                </tr>
              ) : (
                data.jobs.map((job) => (
                  <tr key={job.id} className="border-b border-border last:border-0">
                    <td className="p-3 capitalize">{job.inputType}</td>
                    <td className="p-3">{job.status}</td>
                    <td className="p-3">{job.totalUrls}</td>
                    <td className="p-3">{job.successfulUrls}</td>
                    <td className="p-3">{formatImportDate(job.createdAt)}</td>
                    <td className="p-3">
                      <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`/websites/results?jobId=${job.id}`} />}>
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
