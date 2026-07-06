import { Badge } from "@/components/ui/badge";
import type { PipelineStatus } from "@/lib/types/pipeline";
import { formatPipelineStatus } from "@/lib/services/pipelineService";
import { cn } from "@/lib/utils";

interface PipelineStatusBadgeProps {
  status: PipelineStatus;
  className?: string;
}

const STATUS_VARIANT: Record<PipelineStatus, string> = {
  created: "bg-muted text-muted-foreground",
  queued: "bg-blue-500/10 text-blue-400",
  extracting: "bg-orange-500/10 text-orange-400",
  extracted: "bg-orange-500/10 text-orange-400",
  normalizing: "bg-violet-500/10 text-violet-400",
  normalized: "bg-violet-500/10 text-violet-400",
  matching: "bg-amber-500/10 text-amber-400",
  review: "bg-yellow-500/10 text-yellow-400",
  approved: "bg-emerald-500/10 text-emerald-400",
  rejected: "bg-red-500/10 text-red-400",
  ready_to_publish: "bg-cyan-500/10 text-cyan-400",
  published: "bg-emerald-500/10 text-emerald-400",
  failed: "bg-red-500/10 text-red-400",
};

export function PipelineStatusBadge({ status, className }: PipelineStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("border-transparent font-medium", STATUS_VARIANT[status], className)}
    >
      {formatPipelineStatus(status)}
    </Badge>
  );
}
