import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { QueueExtractionProgress } from "@/lib/types/instagram-profiles";

interface InstagramExtractionProgressProps {
  progress: QueueExtractionProgress | null;
  stats: {
    totalQueued: number;
    processed: number;
    successful: number;
    failed: number;
    duplicates: number;
    rateLimited: number;
  };
}

export function InstagramExtractionProgress({ progress, stats }: InstagramExtractionProgressProps) {
  const remaining =
    progress?.remaining ?? Math.max(0, stats.totalQueued - stats.processed);
  const estimated = progress?.estimatedRemainingSeconds;

  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Extraction Progress</CardTitle>
        <CardDescription>Sequential public profile processing</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
        <Stat label="Queued" value={stats.totalQueued} />
        <Stat label="Processed" value={stats.processed} />
        <Stat label="Successful" value={stats.successful} />
        <Stat label="Failed" value={stats.failed} />
        <Stat label="Duplicates" value={stats.duplicates} />
        <Stat label="Rate Limited" value={stats.rateLimited} />
        <Stat label="Remaining" value={remaining} />
        <Stat
          label="Est. Remaining"
          value={estimated != null ? `${estimated}s` : "—"}
        />
        {progress?.currentProfile ? (
          <div className="sm:col-span-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Current</p>
            <p className="font-medium">{progress.currentProfile}</p>
          </div>
        ) : null}
        {progress?.lastProcessedProfile ? (
          <div className="sm:col-span-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Last Completed</p>
            <p className="font-medium">{progress.lastProcessedProfile}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
