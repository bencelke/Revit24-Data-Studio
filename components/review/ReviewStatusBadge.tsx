import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ReviewRecordStatus } from "@/lib/types/review";
import { getReviewStatusLabel } from "@/lib/services/reviewService";

const statusStyles: Record<ReviewRecordStatus, string> = {
  pending_review: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  approved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  rejected: "border-red-500/30 bg-red-500/10 text-red-400",
  duplicate: "border-orange-500/30 bg-orange-500/10 text-orange-400",
  needs_edit: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  merged: "border-violet-500/30 bg-violet-500/10 text-violet-400",
};

interface ReviewStatusBadgeProps {
  status: ReviewRecordStatus;
  className?: string;
}

export function ReviewStatusBadge({ status, className }: ReviewStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", statusStyles[status], className)}
    >
      {getReviewStatusLabel(status)}
    </Badge>
  );
}
