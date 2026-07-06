import type { LucideIcon } from "lucide-react";
import {
  Card,
  CardHeader,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import type { UnifiedPipelineDashboardStats, PipelineMetrics } from "@/lib/types/pipeline";
import {
  CheckCircle2,
  Clock,
  Loader2,
  Send,
  XCircle,
  Layers,
  Activity,
} from "lucide-react";

interface PipelineSummaryCardsProps {
  stats: UnifiedPipelineDashboardStats;
  metrics?: PipelineMetrics;
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

function formatDuration(ms: number): string {
  if (ms <= 0) return "—";
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return `${hours}h ${rem}m`;
}

export function PipelineSummaryCards({ stats, metrics }: PipelineSummaryCardsProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard label="Running Pipelines" value={stats.runningPipelines} icon={Loader2} />
        <SummaryCard label="Queued" value={stats.queued} icon={Layers} />
        <SummaryCard label="Review Waiting" value={stats.reviewWaiting} icon={Clock} />
        <SummaryCard label="Ready To Publish" value={stats.readyToPublish} icon={Send} />
        <SummaryCard label="Published" value={stats.published} icon={CheckCircle2} />
        <SummaryCard label="Failed" value={stats.failed} icon={XCircle} />
      </div>

      {metrics ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <SummaryCard label="Running Jobs" value={metrics.runningJobs} icon={Activity} />
          <SummaryCard label="Avg Duration" value={formatDuration(metrics.averageDurationMs)} icon={Clock} />
          <SummaryCard label="Success Rate" value={`${metrics.successRate}%`} icon={CheckCircle2} />
          <SummaryCard label="Failure Rate" value={`${metrics.failureRate}%`} icon={XCircle} />
          <SummaryCard label="Records / Hour" value={metrics.recordsPerHour} icon={Layers} />
        </div>
      ) : null}
    </div>
  );
}
