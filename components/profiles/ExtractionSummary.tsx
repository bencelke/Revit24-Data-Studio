import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { QueueExtractionProgress } from "@/lib/types/instagram-profiles";
import { QueueProgressBar } from "@/components/queue/QueueProgressBar";

interface ExtractionSummaryProps {
  progress: QueueExtractionProgress;
  progressPercent: number;
  isRunning?: boolean;
}

function formatEta(seconds: number | null): string {
  if (seconds == null) return "—";
  if (seconds < 60) return `~${seconds}s`;
  const minutes = Math.ceil(seconds / 60);
  return `~${minutes}m`;
}

export function ExtractionSummary({
  progress,
  progressPercent,
  isRunning = false,
}: ExtractionSummaryProps) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Live Extraction</CardTitle>
        <CardDescription>Worker progress — public metadata only</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <QueueProgressBar
          percent={progressPercent}
          label="Overall progress"
          animated={isRunning}
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Metric label="Current Profile" value={progress.currentProfile ?? "—"} />
          <Metric label="Last Processed" value={progress.lastProcessedProfile ?? "—"} />
          <Metric label="Remaining" value={progress.remaining.toLocaleString()} />
          <Metric label="Successful" value={progress.successful.toLocaleString()} />
          <Metric label="Failed" value={progress.failed.toLocaleString()} />
          <Metric
            label="Est. Remaining"
            value={formatEta(progress.estimatedRemainingSeconds)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium text-foreground">{value}</p>
    </div>
  );
}
