import { Progress } from "@/components/ui/progress";
import type { PipelineJobDocument } from "@/lib/types/pipeline";
import { formatPipelineStage } from "@/lib/services/pipelineService";

interface PipelineProgressProps {
  job: PipelineJobDocument;
  estimatedRemainingMs?: number | null;
}

function formatEta(ms: number | null | undefined): string {
  if (ms == null || ms <= 0) return "—";
  const minutes = Math.ceil(ms / 60000);
  if (minutes < 60) return `~${minutes}m remaining`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return `~${hours}h ${rem}m remaining`;
}

export function PipelineProgress({ job, estimatedRemainingMs }: PipelineProgressProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Current stage: <span className="text-foreground">{formatPipelineStage(job.currentStage)}</span>
        </span>
        <span className="font-medium">{job.progress}%</span>
      </div>
      <Progress value={job.progress} className="h-2" />
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span>
          {job.processedRecords} / {job.totalRecords} records
        </span>
        <span>{job.successfulRecords} successful</span>
        <span>{job.failedRecords} failed</span>
        <span>{formatEta(estimatedRemainingMs)}</span>
      </div>
    </div>
  );
}
