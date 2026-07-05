import type { LucideIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ReviewDashboardStats } from "@/lib/types/review";
import {
  CheckCircle2,
  Clock,
  Copy,
  Edit3,
  Hourglass,
  XCircle,
} from "lucide-react";

interface ReviewSummaryCardsProps {
  stats: ReviewDashboardStats;
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  description,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
}) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription className="text-xs uppercase tracking-wide">
            {label}
          </CardDescription>
          <Icon className="size-4 text-muted-foreground" aria-hidden />
        </div>
        <CardTitle className="text-2xl font-semibold tracking-tight">
          {value}
        </CardTitle>
      </CardHeader>
      {description ? (
        <CardContent>
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
      ) : null}
    </Card>
  );
}

export function ReviewSummaryCards({ stats }: ReviewSummaryCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <SummaryCard
        label="Pending Review"
        value={stats.pendingReview}
        icon={Hourglass}
      />
      <SummaryCard
        label="Approved Today"
        value={stats.approvedToday}
        icon={CheckCircle2}
      />
      <SummaryCard
        label="Rejected Today"
        value={stats.rejectedToday}
        icon={XCircle}
      />
      <SummaryCard label="Needs Edit" value={stats.needsEdit} icon={Edit3} />
      <SummaryCard label="Duplicates" value={stats.duplicates} icon={Copy} />
      <SummaryCard
        label="Avg Review Time"
        value={`${stats.averageReviewTimeMinutes}m`}
        icon={Clock}
        description="From import to first decision"
      />
    </div>
  );
}
