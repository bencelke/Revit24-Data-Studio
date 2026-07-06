import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { InstagramResultsSummary } from "@/lib/types/instagramExtractionQueue";

interface ResultsSummaryCardsProps {
  summary: InstagramResultsSummary;
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
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryCard label="Pending" value={summary.pending} />
      <SummaryCard label="Running" value={summary.running} />
      <SummaryCard label="Success" value={summary.success} />
      <SummaryCard label="Failed" value={summary.failed} />
    </div>
  );
}
