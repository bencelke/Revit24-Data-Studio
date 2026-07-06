import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SimpleParseSummary } from "@/lib/types/simpleInstagramImport";

interface InstagramImportSummaryProps {
  summary: SimpleParseSummary;
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

export function InstagramImportSummary({ summary }: InstagramImportSummaryProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryCard label="Total" value={summary.total} />
      <SummaryCard label="Valid" value={summary.valid} />
      <SummaryCard label="Duplicate" value={summary.duplicate} />
      <SummaryCard label="Invalid" value={summary.invalid} />
    </div>
  );
}
