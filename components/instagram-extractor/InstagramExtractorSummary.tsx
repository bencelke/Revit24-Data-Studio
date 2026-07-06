import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { InstagramParseSummary } from "@/lib/types/instagramExtraction";

interface InstagramExtractorSummaryProps {
  summary: InstagramParseSummary;
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

export function InstagramExtractorSummary({ summary }: InstagramExtractorSummaryProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <SummaryCard label="Total" value={summary.total} />
      <SummaryCard label="Valid" value={summary.valid} />
      <SummaryCard label="Duplicates" value={summary.duplicate} />
      <SummaryCard label="Invalid" value={summary.invalid} />
      <SummaryCard label="Queued" value={summary.queued ?? 0} />
    </div>
  );
}
