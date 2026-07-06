import type { LucideIcon } from "lucide-react";
import {
  Card,
  CardHeader,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import type { DiscoveryDashboardStats } from "@/lib/types/discovery-engine";
import {
  Activity,
  CheckCircle2,
  ClipboardList,
  Layers,
  Search,
  Sparkles,
} from "lucide-react";

interface DiscoverySummaryCardsProps {
  stats: DiscoveryDashboardStats;
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
}) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription className="text-xs uppercase tracking-wide">
            {label}
          </CardDescription>
          <Icon className="size-4 text-muted-foreground" aria-hidden />
        </div>
        <CardTitle className="text-2xl font-semibold tracking-tight">
          {value}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}

export function DiscoverySummaryCards({ stats }: DiscoverySummaryCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <SummaryCard label="Active Campaigns" value={stats.activeCampaigns} icon={Activity} />
      <SummaryCard label="Running Jobs" value={stats.runningJobs} icon={Layers} />
      <SummaryCard label="Completed Today" value={stats.completedToday} icon={CheckCircle2} />
      <SummaryCard label="New Results" value={stats.newResults} icon={Sparkles} />
      <SummaryCard label="Import Queue" value={stats.importQueue} icon={Search} />
      <SummaryCard label="Review Queue" value={stats.reviewQueue} icon={ClipboardList} />
    </div>
  );
}
