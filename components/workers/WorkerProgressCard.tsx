import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { QueueProgressBar } from "@/components/queue/QueueProgressBar";
import { QueueStatusBadge } from "@/components/queue/QueueStatusBadge";
import type { LiveJobProgress } from "@/lib/types/runtime";
import { formatEstimatedRemaining } from "@/lib/services/progressService";

interface WorkerProgressCardProps {
  progress: LiveJobProgress;
}

export function WorkerProgressCard({ progress }: WorkerProgressCardProps) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base font-semibold">{progress.jobName}</CardTitle>
            <CardDescription>
              {progress.currentProfile
                ? `Processing ${progress.currentProfile}`
                : progress.lastProcessedProfile
                  ? `Last: ${progress.lastProcessedProfile}`
                  : "Awaiting records"}
            </CardDescription>
          </div>
          <QueueStatusBadge status={progress.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <QueueProgressBar percent={progress.progressPercent} label="Progress" />
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Processed</p>
            <p className="font-medium">{progress.processedRecords}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Remaining</p>
            <p className="font-medium">{progress.remainingRecords}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Successful</p>
            <p className="font-medium text-emerald-400">{progress.successfulRecords}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Failed</p>
            <p className="font-medium text-red-400">{progress.failedRecords}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          ETA: {formatEstimatedRemaining(progress.estimatedRemainingSeconds)}
          {progress.claimedByWorkerId
            ? ` · Worker: ${progress.claimedByWorkerId}`
            : null}
        </p>
      </CardContent>
    </Card>
  );
}
