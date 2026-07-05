import type { ReviewActivityItem } from "@/lib/types/review";
import { formatReviewDate } from "@/lib/services/reviewService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ReviewActivityPanelProps {
  activity: ReviewActivityItem[];
}

const statusDot: Record<ReviewActivityItem["status"], string> = {
  success: "bg-emerald-400",
  pending: "bg-amber-400",
  warning: "bg-red-400",
};

export function ReviewActivityPanel({ activity }: ReviewActivityPanelProps) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
        <CardDescription>Latest moderation actions across the review queue</CardDescription>
      </CardHeader>
      <CardContent>
        {activity.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity.</p>
        ) : (
          <ul className="space-y-3">
            {activity.map((item) => (
              <li key={item.id} className="flex items-start gap-3 text-sm">
                <span
                  className={cn("mt-1.5 size-2 shrink-0 rounded-full", statusDot[item.status])}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="text-foreground">
                    <span className="font-medium">{item.actor}</span>{" "}
                    {item.action}{" "}
                    <span className="font-medium">{item.target}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatReviewDate(item.timestamp)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
