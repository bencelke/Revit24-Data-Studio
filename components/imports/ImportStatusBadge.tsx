import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ImportStatus } from "@/lib/types/imports";
import { getImportStatusLabel } from "@/lib/services/importService";

const statusStyles: Record<ImportStatus, string> = {
  draft: "border-border text-muted-foreground",
  queued: "border-brand/30 bg-brand/10 text-brand",
  running: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  completed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  failed: "border-red-500/30 bg-red-500/10 text-red-400",
  cancelled: "border-border bg-muted text-muted-foreground",
  pending_review: "border-amber-500/30 bg-amber-500/10 text-amber-400",
};

interface ImportStatusBadgeProps {
  status: ImportStatus;
  className?: string;
}

export function ImportStatusBadge({ status, className }: ImportStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium capitalize", statusStyles[status], className)}
    >
      {getImportStatusLabel(status)}
    </Badge>
  );
}
