import type { PipelineEventDocument } from "@/lib/types/pipeline";
import { formatPipelineStage } from "@/lib/services/pipelineService";
import { PipelineStatusBadge } from "./PipelineStatusBadge";
import { cn } from "@/lib/utils";

interface PipelineTimelineProps {
  events: PipelineEventDocument[];
}

function formatTime(value: string): string {
  return new Date(value).toLocaleString();
}

function formatDuration(ms: number | null): string {
  if (ms == null) return "";
  if (ms < 1000) return `${ms}ms`;
  return `${Math.round(ms / 1000)}s`;
}

export function PipelineTimeline({ events }: PipelineTimelineProps) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No timeline events recorded for this pipeline.</p>
    );
  }

  return (
    <ol className="relative space-y-4 border-l border-border pl-6">
      {events.map((event, index) => (
        <li key={event.id} className="relative">
          <span
            className={cn(
              "absolute -left-[1.6rem] top-1 size-3 rounded-full border-2 border-background",
              index === events.length - 1 ? "bg-orange-400" : "bg-muted-foreground",
            )}
          />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">{formatPipelineStage(event.stage)}</span>
              <PipelineStatusBadge status={event.status} />
              {event.duration != null ? (
                <span className="text-xs text-muted-foreground">{formatDuration(event.duration)}</span>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">{event.message}</p>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span>{formatTime(event.timestamp)}</span>
              {event.worker ? <span>Worker: {event.worker}</span> : null}
              {event.recordId ? <span>Record: {event.recordId}</span> : null}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
