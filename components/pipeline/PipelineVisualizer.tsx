import type { PipelineJobDocument } from "@/lib/types/pipeline";
import { formatPipelineProvider } from "@/lib/services/pipelineService";
import { PipelineStageCard } from "./PipelineStageCard";

interface PipelineVisualizerProps {
  job: PipelineJobDocument;
}

export function PipelineVisualizer({ job }: PipelineVisualizerProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{formatPipelineProvider(job.provider)} Import</h3>
        <p className="text-sm text-muted-foreground">
          Unified lifecycle — every record passes through all stages.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {job.stageProgress.map((stage) => (
          <PipelineStageCard key={stage.stage} stage={stage} />
        ))}
      </div>
    </div>
  );
}
