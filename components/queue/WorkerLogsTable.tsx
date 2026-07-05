"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/imports/EmptyState";
import { WORKER_LOG_LEVELS } from "@/lib/types/workers";
import type { WorkerDocument, WorkerLogDocument, WorkerLogLevel } from "@/lib/types/workers";
import {
  formatWorkerDate,
  getWorkerLogLevelLabel,
} from "@/lib/services/workerService";
import { cn } from "@/lib/utils";

const levelStyles: Record<WorkerLogLevel, string> = {
  debug: "border-border text-muted-foreground",
  info: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  error: "border-red-500/30 bg-red-500/10 text-red-400",
};

interface WorkerLogsTableProps {
  logs: WorkerLogDocument[];
  workers: WorkerDocument[];
  search: string;
  level: WorkerLogLevel | "all";
  workerId: string | "all";
  onSearchChange: (value: string) => void;
  onLevelChange: (value: WorkerLogLevel | "all") => void;
  onWorkerChange: (value: string | "all") => void;
}

export function WorkerLogsTable({
  logs,
  workers,
  search,
  level,
  workerId,
  onSearchChange,
  onLevelChange,
  onWorkerChange,
}: WorkerLogsTableProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={level} onValueChange={(value) => onLevelChange(value as WorkerLogLevel | "all")}>
          <SelectTrigger className="w-full lg:w-36">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            {WORKER_LOG_LEVELS.map((entry) => (
              <SelectItem key={entry} value={entry}>
                {getWorkerLogLevelLabel(entry)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={workerId} onValueChange={(value) => onWorkerChange(value ?? "all")}>
          <SelectTrigger className="w-full lg:w-52">
            <SelectValue placeholder="Worker" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All workers</SelectItem>
            {workers.map((worker) => (
              <SelectItem key={worker.id} value={worker.id}>
                {worker.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {logs.length === 0 ? (
        <EmptyState
          title="No worker logs found"
          description="Try adjusting your search or filters."
        />
      ) : (
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Timestamp</TableHead>
                <TableHead>Worker</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatWorkerDate(log.timestamp)}
                  </TableCell>
                  <TableCell className="font-medium">{log.workerName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("font-medium", levelStyles[log.level])}>
                      {getWorkerLogLevelLabel(log.level)}
                    </Badge>
                  </TableCell>
                  <TableCell>{log.event}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {log.jobId ?? "—"}
                  </TableCell>
                  <TableCell className="max-w-[320px] truncate">{log.message}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
