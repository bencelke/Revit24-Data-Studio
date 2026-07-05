import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { WorkerDocument } from "@/lib/types/workers";
import {
  formatRelativeHeartbeat,
  getWorkerStatusLabel,
} from "@/lib/services/workerService";
import { cn } from "@/lib/utils";

const statusStyles: Record<WorkerDocument["status"], string> = {
  online: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  offline: "border-border text-muted-foreground",
  busy: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  idle: "border-brand/30 bg-brand/10 text-brand",
  maintenance: "border-amber-500/30 bg-amber-500/10 text-amber-400",
};

interface WorkerRuntimeTableProps {
  workers: WorkerDocument[];
}

export function WorkerRuntimeTable({ workers }: WorkerRuntimeTableProps) {
  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Worker</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Platform</TableHead>
            <TableHead>Heartbeat</TableHead>
            <TableHead>Current Job</TableHead>
            <TableHead className="text-right">Completed</TableHead>
            <TableHead className="text-right">CPU</TableHead>
            <TableHead className="text-right">Memory</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground">
                No workers registered.
              </TableCell>
            </TableRow>
          ) : (
            workers.map((worker) => (
              <TableRow key={worker.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{worker.name}</p>
                    <p className="text-xs text-muted-foreground">{worker.hostname}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn("font-medium", statusStyles[worker.status])}
                  >
                    {getWorkerStatusLabel(worker.status)}
                  </Badge>
                </TableCell>
                <TableCell>{worker.platform}</TableCell>
                <TableCell>{formatRelativeHeartbeat(worker.lastHeartbeat)}</TableCell>
                <TableCell className="max-w-[160px] truncate">
                  {worker.currentJob ?? "—"}
                </TableCell>
                <TableCell className="text-right">{worker.jobsCompleted}</TableCell>
                <TableCell className="text-right">
                  {worker.cpuUsagePercent != null ? `${worker.cpuUsagePercent}%` : "—"}
                </TableCell>
                <TableCell className="text-right">
                  {worker.memoryUsagePercent != null ? `${worker.memoryUsagePercent}%` : "—"}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
