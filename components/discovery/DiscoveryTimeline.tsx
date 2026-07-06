import type { DiscoveryJobDocument } from "@/lib/types/discovery-engine";
import { formatDiscoveryProvider } from "@/lib/services/keywordGenerationService";
import { cn } from "@/lib/utils";

interface DiscoveryTimelineProps {
  jobs: DiscoveryJobDocument[];
}

function formatTime(value: string): string {
  return new Date(value).toLocaleString();
}

export function DiscoveryTimeline({ jobs }: DiscoveryTimelineProps) {
  if (jobs.length === 0) {
    return <p className="text-sm text-muted-foreground">No job history for this campaign.</p>;
  }

  return (
    <ol className="relative space-y-4 border-l border-border pl-6">
      {jobs.map((job, index) => (
        <li key={job.id} className="relative">
          <span
            className={cn(
              "absolute -left-[1.6rem] top-1 size-3 rounded-full border-2 border-background",
              index === 0 ? "bg-orange-400" : "bg-muted-foreground",
            )}
          />
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {formatDiscoveryProvider(job.provider)} — {job.status}
            </p>
            <p className="text-xs text-muted-foreground">
              {job.processedResults} results · {job.importedResults} imported ·{" "}
              {formatTime(job.createdAt)}
            </p>
            {job.errorMessage ? (
              <p className="text-xs text-red-400">{job.errorMessage}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
