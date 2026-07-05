import type { LucideIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building2, CheckCircle2, Clock, Search } from "lucide-react";

interface PlacesSummaryCardsProps {
  totalJobs: number;
  completedJobs: number;
  totalPlaces: number;
  importedPlaces: number;
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
          <CardDescription className="text-xs uppercase tracking-wide">{label}</CardDescription>
          <Icon className="size-4 text-muted-foreground" aria-hidden />
        </div>
        <CardTitle className="text-2xl font-semibold tracking-tight">{value}</CardTitle>
      </CardHeader>
      {description ? (
        <CardContent>
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
      ) : null}
    </Card>
  );
}

export function PlacesSummaryCards({
  totalJobs,
  completedJobs,
  totalPlaces,
  importedPlaces,
}: PlacesSummaryCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryCard label="Search Jobs" value={totalJobs} icon={Search} />
      <SummaryCard label="Completed" value={completedJobs} icon={CheckCircle2} />
      <SummaryCard label="Discovered" value={totalPlaces} icon={Building2} />
      <SummaryCard label="Imported" value={importedPlaces} icon={Clock} description="Into review workflow" />
    </div>
  );
}
