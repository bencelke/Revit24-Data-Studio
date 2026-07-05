import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ExtractionJobStatus } from "@/lib/types/queue";
import { getQueueStatusLabel } from "@/lib/services/queueService";

const statusStyles: Record<ExtractionJobStatus, string> = {
  waiting: "border-border text-muted-foreground",
  queued: "border-brand/30 bg-brand/10 text-brand",
  running: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  paused: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  completed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  failed: "border-red-500/30 bg-red-500/10 text-red-400",
  cancelled: "border-border bg-muted text-muted-foreground",
  retrying: "border-violet-500/30 bg-violet-500/10 text-violet-400",
};

interface QueueStatusBadgeProps {
  status: ExtractionJobStatus;
  className?: string;
}

export function QueueStatusBadge({ status, className }: QueueStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", statusStyles[status], className)}
    >
      {getQueueStatusLabel(status)}
    </Badge>
  );
}
