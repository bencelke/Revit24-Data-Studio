import type { InstagramProfileInputSummary } from "@/lib/types/instagram-imports";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ImportPreviewSummaryProps {
  summary: InstagramProfileInputSummary | null;
}

export function ImportPreviewSummary({ summary }: ImportPreviewSummaryProps) {
  const items = summary
    ? [
        { label: "Total lines", value: summary.totalLines },
        { label: "Valid profiles", value: summary.validProfiles },
        { label: "Duplicates", value: summary.duplicates },
        { label: "Invalid rows", value: summary.invalidRows },
      ]
    : [
        { label: "Total lines", value: "—" },
        { label: "Valid profiles", value: "—" },
        { label: "Duplicates", value: "—" },
        { label: "Invalid rows", value: "—" },
      ];

  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Import Summary</CardTitle>
        <CardDescription>
          Parsed results from your bulk profile input
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-4">
          {items.map((item) => (
            <div key={item.label} className="space-y-1">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                {item.label}
              </dt>
              <dd className="text-2xl font-semibold tracking-tight">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
