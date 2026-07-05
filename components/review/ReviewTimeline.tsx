import type { ReviewHistoryEntry } from "@/lib/types/review";
import { ReviewStatusBadge } from "./ReviewStatusBadge";
import { formatReviewDate } from "@/lib/services/reviewService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ReviewTimelineProps {
  history: ReviewHistoryEntry[];
}

export function ReviewTimeline({ history }: ReviewTimelineProps) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Review History</CardTitle>
        <CardDescription>Status changes and moderation actions</CardDescription>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">No review history yet.</p>
        ) : (
          <ol className="relative space-y-4 border-l border-border pl-4">
            {history.map((entry) => (
              <li key={entry.id} className="relative">
                <span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-brand" />
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <ReviewStatusBadge status={entry.previousStatus} />
                    <span className="text-muted-foreground">→</span>
                    <ReviewStatusBadge status={entry.newStatus} />
                  </div>
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{entry.reviewer}</span>
                    {entry.reason ? ` · ${entry.reason.replace(/_/g, " ")}` : null}
                  </p>
                  {entry.notes ? (
                    <p className="text-sm text-muted-foreground">{entry.notes}</p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    {formatReviewDate(entry.timestamp)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
