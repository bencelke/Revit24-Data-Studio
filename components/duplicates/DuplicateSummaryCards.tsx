import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DuplicateDashboardStats } from "@/lib/types/duplicates";

interface DuplicateSummaryCardsProps {
  stats: DuplicateDashboardStats;
}

export function DuplicateSummaryCards({ stats }: DuplicateSummaryCardsProps) {
  const cards = [
    { label: "Pending Matches", value: stats.pendingMatches },
    { label: "High Confidence", value: stats.highConfidence },
    { label: "Medium Confidence", value: stats.mediumConfidence },
    { label: "Low Confidence", value: stats.lowConfidence },
    { label: "Resolved Today", value: stats.resolvedToday },
    { label: "Ignored Today", value: stats.ignoredToday },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.label} className="border-border bg-card shadow-none">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wide">
              {card.label}
            </CardDescription>
            <CardTitle className="text-2xl font-semibold tracking-tight">
              {card.value}
            </CardTitle>
          </CardHeader>
          <CardContent />
        </Card>
      ))}
    </div>
  );
}
