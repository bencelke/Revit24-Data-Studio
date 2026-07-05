import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { WorkerDocument } from "@/lib/types/workers";
import { getWorkerStatusLabel } from "@/lib/services/workerService";
import { WorkerHeartbeat } from "./WorkerHeartbeat";
import { cn } from "@/lib/utils";
import { Cpu, HardDrive, Server } from "lucide-react";

const statusStyles: Record<WorkerDocument["status"], string> = {
  online: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  offline: "border-border text-muted-foreground",
  busy: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  idle: "border-brand/30 bg-brand/10 text-brand",
  maintenance: "border-amber-500/30 bg-amber-500/10 text-amber-400",
};

interface WorkerStatusCardProps {
  worker: WorkerDocument;
}

export function WorkerStatusCard({ worker }: WorkerStatusCardProps) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold">{worker.name}</CardTitle>
            <CardDescription>
              {worker.hostname} · v{worker.version}
            </CardDescription>
          </div>
          <Badge variant="outline" className={cn("font-medium", statusStyles[worker.status])}>
            {getWorkerStatusLabel(worker.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Server className="size-4 shrink-0" />
          <span>{worker.machineName}</span>
        </div>
        <WorkerHeartbeat lastHeartbeat={worker.lastHeartbeat} />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs text-muted-foreground">Current Job</p>
            <p className="truncate font-medium">{worker.currentJob ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Jobs Completed</p>
            <p className="font-medium">{worker.jobsCompleted.toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-2">
            <Cpu className="size-4 text-muted-foreground" />
            <span>{worker.cpuUsagePercent != null ? `${worker.cpuUsagePercent}%` : "—"}</span>
          </div>
          <div className="flex items-center gap-2">
            <HardDrive className="size-4 text-muted-foreground" />
            <span>{worker.memoryUsagePercent != null ? `${worker.memoryUsagePercent}%` : "—"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
