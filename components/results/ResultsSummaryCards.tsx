import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface InstagramExtractedResultsSummary {
  total: number;
  clubs: number;
  members: number;
  unknown: number;
  success: number;
  failed: number;
}

interface ResultsSummaryCardsProps {
  summary: InstagramExtractedResultsSummary;
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader className="pb-2">
        <CardDescription className="text-xs uppercase tracking-wide">{label}</CardDescription>
        <CardTitle className="text-2xl font-semibold">{value}</CardTitle>
      </CardHeader>
      <CardContent />
    </Card>
  );
}

export function ResultsSummaryCards({ summary }: ResultsSummaryCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
      <SummaryCard label="Total" value={summary.total} />
      <SummaryCard label="Clubs" value={summary.clubs} />
      <SummaryCard label="Members" value={summary.members} />
      <SummaryCard label="Unknown" value={summary.unknown} />
      <SummaryCard label="Success" value={summary.success} />
      <SummaryCard label="Failed" value={summary.failed} />
    </div>
  );
}
