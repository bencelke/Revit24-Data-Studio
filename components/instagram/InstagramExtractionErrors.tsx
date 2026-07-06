import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InstagramExtractionErrorCard } from "./InstagramExtractionErrorCard";
import type { ExtractionJobDocument } from "@/lib/types/queue";

interface InstagramExtractionErrorsProps {
  jobs: ExtractionJobDocument[];
}

export function InstagramExtractionErrors({ jobs }: InstagramExtractionErrorsProps) {
  const failedJobs = jobs.filter(
    (job) => job.status === "failed" || job.failedRecords > 0,
  );

  if (failedJobs.length === 0) {
    return (
      <Card className="border-border bg-card shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Recent Errors</CardTitle>
          <CardDescription>No failed extraction jobs</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Failures will appear here with error types such as profile_not_found, profile_private,
          rate_limited, and network_timeout.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Recent Errors</CardTitle>
        <CardDescription>Jobs with failed profile extractions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {failedJobs.slice(0, 5).map((job) => (
          <div
            key={job.id}
            className="rounded-lg border border-border px-3 py-2 text-sm"
          >
            <p className="font-medium">{job.name}</p>
            <p className="text-muted-foreground">
              {job.failedRecords} failed · {job.successfulRecords} successful
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export { InstagramExtractionErrorCard };
