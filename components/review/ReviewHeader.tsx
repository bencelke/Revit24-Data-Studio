import type { ReviewRecordView } from "@/lib/types/review";
import { ReviewStatusBadge } from "./ReviewStatusBadge";
import { formatReviewDate, getReviewImportSourceLabel } from "@/lib/services/reviewService";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User } from "lucide-react";

interface ReviewHeaderProps {
  record: ReviewRecordView;
}

export function ReviewHeader({ record }: ReviewHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-4">
        <Avatar className="size-14">
          <AvatarFallback className="bg-muted text-muted-foreground">
            <User className="size-6" />
          </AvatarFallback>
        </Avatar>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold tracking-tight">
              {record.displayName ?? record.username ?? "Untitled Record"}
            </h2>
            <ReviewStatusBadge status={record.reviewStatus} />
          </div>
          <p className="text-sm text-muted-foreground">
            {record.username ? `@${record.username}` : "No username"} ·{" "}
            {getReviewImportSourceLabel(record.importSource)}
          </p>
        </div>
      </div>

      <div className="grid gap-1 text-sm sm:text-right">
        <p className="text-muted-foreground">
          Job: <span className="text-foreground">{record.jobName}</span>
        </p>
        <p className="text-muted-foreground">
          Created {formatReviewDate(record.createdAt)}
        </p>
        {record.reviewer ? (
          <p className="text-muted-foreground">
            Reviewer: <span className="text-foreground">{record.reviewer}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
