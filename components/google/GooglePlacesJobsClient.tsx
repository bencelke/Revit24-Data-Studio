"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatImportDate } from "@/lib/services/importService";
import type { PlacesSearchJobDocument } from "@/lib/types/google-places";

interface GooglePlacesJobsClientProps {
  jobs: PlacesSearchJobDocument[];
}

export function GooglePlacesJobsClient({ jobs }: GooglePlacesJobsClientProps) {
  const router = useRouter();
  const [loadingJobId, setLoadingJobId] = useState<string | null>(null);

  async function rerunJob(jobId: string) {
    setLoadingJobId(jobId);
    try {
      const response = await fetch(`/api/google-places/search/${jobId}/rerun`, { method: "POST" });
      if (response.ok) {
        const data = (await response.json()) as { jobId: string };
        router.push(`/google-places/results?jobId=${data.jobId}`);
      }
    } finally {
      setLoadingJobId(null);
    }
  }

  async function cloneJob(jobId: string) {
    setLoadingJobId(jobId);
    try {
      const response = await fetch(`/api/google-places/search/${jobId}/clone`, { method: "POST" });
      if (response.ok) {
        const data = (await response.json()) as { jobId: string };
        router.push(`/google-places/results?jobId=${data.jobId}`);
      }
    } finally {
      setLoadingJobId(null);
    }
  }

  return (
    <div className="rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="p-3">Query</th>
            <th className="p-3">Type</th>
            <th className="p-3">Status</th>
            <th className="p-3">Results</th>
            <th className="p-3">Created</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.length === 0 ? (
            <tr>
              <td colSpan={6} className="p-6 text-center text-muted-foreground">
                No search jobs yet.
              </td>
            </tr>
          ) : (
            jobs.map((job) => (
              <tr key={job.id} className="border-b border-border last:border-0">
                <td className="p-3">
                  {[job.query.keyword, job.query.category, job.query.city, job.query.country]
                    .filter(Boolean)
                    .join(" · ") || "Search"}
                  {job.clonedFromJobId ? (
                    <span className="ml-2 text-xs text-muted-foreground">(cloned)</span>
                  ) : null}
                </td>
                <td className="p-3">{job.searchType ?? "text"}</td>
                <td className="p-3">
                  {job.status}
                  {job.errorMessage ? (
                    <span className="block text-xs text-amber-500">{job.errorMessage}</span>
                  ) : null}
                </td>
                <td className="p-3">{job.totalResults}</td>
                <td className="p-3">{formatImportDate(job.createdAt)}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      nativeButton={false}
                      render={<Link href={`/google-places/results?jobId=${job.id}`} />}
                    >
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={loadingJobId === job.id}
                      onClick={() => void rerunJob(job.id)}
                    >
                      Rerun
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={loadingJobId === job.id}
                      onClick={() => void cloneJob(job.id)}
                    >
                      Clone
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
