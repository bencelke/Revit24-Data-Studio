import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CsvValidationSummary } from "@/lib/types/csv-import";

interface CsvValidationSummaryProps {
  summary: CsvValidationSummary | null;
}

export function CsvValidationSummaryCards({ summary }: CsvValidationSummaryProps) {
  if (!summary) return null;

  const cards = [
    { label: "Total Rows", value: summary.totalRows },
    { label: "Valid", value: summary.validRows },
    { label: "Invalid", value: summary.invalidRows },
    { label: "Duplicates", value: summary.duplicateRows },
    { label: "Warnings", value: summary.warningRows },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.label} className="border-border bg-card shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {card.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
