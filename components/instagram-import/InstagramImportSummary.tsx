import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { InstagramSimpleImportSummary } from "@/lib/types/instagramSimpleImport";

interface InstagramImportSummaryProps {
  summary: InstagramSimpleImportSummary;
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
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
      <SummaryCard label="Total Links" value={summary.totalLinks} />
      <SummaryCard label="Valid" value={summary.valid} />
      <SummaryCard label="Duplicates" value={summary.duplicates} />
      <SummaryCard label="Invalid" value={summary.invalid} />
      <SummaryCard label="Extracted" value={summary.extracted} />
      <SummaryCard label="Failed" value={summary.failed} />
    </div>
  );
}
