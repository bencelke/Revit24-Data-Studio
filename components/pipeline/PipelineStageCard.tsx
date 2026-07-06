import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";
import type { PipelineStageProgress } from "@/lib/types/pipeline";
import { formatPipelineStage } from "@/lib/services/pipelineService";
import { cn } from "@/lib/utils";

interface PipelineStageCardProps {
  stage: PipelineStageProgress;
}

function formatDuration(ms: number | null): string {
  if (ms == null || ms <= 0) return "—";
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.round(seconds / 60)}m`;
}

function StageIcon({ status }: { status: PipelineStageProgress["status"] }) {
  if (status === "completed") {
    return <CheckCircle2 className="size-5 text-emerald-400" aria-hidden />;
  }
  if (status === "running") {
    return <Loader2 className="size-5 animate-spin text-orange-400" aria-hidden />;
  }
  if (status === "failed") {
    return <XCircle className="size-5 text-red-400" aria-hidden />;
  }
  return <Circle className="size-5 text-muted-foreground" aria-hidden />;
}

export function PipelineStageCard({ stage }: PipelineStageCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4",
        stage.status === "running" && "border-orange-500/40",
        stage.status === "failed" && "border-red-500/40",
      )}
    >
      <div className="flex items-start gap-3">
        <StageIcon status={stage.status} />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium">{formatPipelineStage(stage.stage)}</p>
            <span className="text-xs capitalize text-muted-foreground">{stage.status}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
            <span>Duration: {formatDuration(stage.durationMs)}</span>
            <span>Records: {stage.recordCount}</span>
            <span>Errors: {stage.errorCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
