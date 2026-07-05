import type { LucideIcon } from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { QueueDashboardStats } from "@/lib/types/queue";
import {
  CheckCircle2,
  Clock,
  Loader2,
  Pause,
  RefreshCw,
  XCircle,
  Layers,
} from "lucide-react";

interface QueueSummaryCardsProps {
  stats: QueueDashboardStats;
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

export function QueueSummaryCards({ stats }: QueueSummaryCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryCard label="Waiting" value={stats.waiting} icon={Clock} />
      <SummaryCard label="Queued" value={stats.queued} icon={Layers} />
      <SummaryCard label="Running" value={stats.running} icon={Loader2} />
      <SummaryCard
        label="Completed Today"
        value={stats.completedToday}
        icon={CheckCircle2}
      />
      <SummaryCard label="Failed" value={stats.failed} icon={XCircle} />
      <SummaryCard label="Paused" value={stats.paused} icon={Pause} />
      <SummaryCard label="Retrying" value={stats.retrying} icon={RefreshCw} />
    </div>
  );
}
