import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WebsiteSummaryCardsProps {
  totalJobs: number;
  completedJobs: number;
  totalWebsites: number;
  importedWebsites: number;
}

export function WebsiteSummaryCards({
  totalJobs,
  completedJobs,
  totalWebsites,
  importedWebsites,
}: WebsiteSummaryCardsProps) {
  const cards = [
    { label: "Discovery Jobs", value: totalJobs },
    { label: "Completed Jobs", value: completedJobs },
    { label: "Websites Extracted", value: totalWebsites },
    { label: "Imported", value: importedWebsites },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="border-border bg-card shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
