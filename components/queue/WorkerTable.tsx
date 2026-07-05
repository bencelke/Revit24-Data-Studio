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

interface WorkerTableProps {
  workers: WorkerDocument[];
}

const statusStyles: Record<WorkerDocument["status"], string> = {
  online: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  offline: "border-border text-muted-foreground",
  busy: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  idle: "border-brand/30 bg-brand/10 text-brand",
  maintenance: "border-amber-500/30 bg-amber-500/10 text-amber-400",
};

export function WorkerTable({ workers }: WorkerTableProps) {
  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Worker Name</TableHead>
            <TableHead>Version</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Machine</TableHead>
            <TableHead>Platform</TableHead>
            <TableHead>Last Heartbeat</TableHead>
            <TableHead className="text-right">Completed</TableHead>
            <TableHead className="text-right">Running</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workers.map((worker) => (
            <TableRow key={worker.id}>
              <TableCell className="font-medium">{worker.name}</TableCell>
              <TableCell className="text-muted-foreground">{worker.version}</TableCell>
              <TableCell>
                <Badge variant="outline" className={cn("font-medium", statusStyles[worker.status])}>
                  {getWorkerStatusLabel(worker.status)}
                </Badge>
              </TableCell>
              <TableCell>{worker.machine}</TableCell>
              <TableCell>{worker.platform}</TableCell>
              <TableCell className="text-muted-foreground">
                {formatRelativeHeartbeat(worker.lastHeartbeat)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {worker.jobsCompleted.toLocaleString()}
              </TableCell>
              <TableCell className="text-right tabular-nums">{worker.jobsRunning}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
