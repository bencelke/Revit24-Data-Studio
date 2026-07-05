import type { LucideIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { EntitiesDashboardStats } from "@/lib/types/normalization";
import { CheckCircle2, Copy, Database, Hourglass } from "lucide-react";

interface EntitiesSummaryCardsProps {
  stats: EntitiesDashboardStats;
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

export function EntitiesSummaryCards({ stats }: EntitiesSummaryCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryCard
        label="Normalized Records"
        value={stats.totalNormalized}
        icon={Database}
        description="Structured automotive entities"
      />
      <SummaryCard
        label="Pending Review"
        value={stats.pendingReview}
        icon={Hourglass}
        description="Awaiting admin approval"
      />
      <SummaryCard
        label="Approved"
        value={stats.approved}
        icon={CheckCircle2}
        description="Ready for downstream sync"
      />
      <SummaryCard
        label="High-Confidence Matches"
        value={stats.highConfidenceMatches}
        icon={Copy}
        description="Potential duplicates detected"
      />
    </div>
  );
}
