"use client";

import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, MoreHorizontal } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QueueStatusBadge } from "./QueueStatusBadge";
import { QueueProgressBar } from "./QueueProgressBar";
import { EmptyState } from "@/components/imports/EmptyState";
import {
  formatDuration,
  formatQueueDate,
  getQueuePlatformLabel,
  getQueuePriorityLabel,
} from "@/lib/services/queueService";
import type {
  ExtractionPriority,
  QueueJobView,
  QueueSortDirection,
  QueueSortField,
} from "@/lib/types/queue";
import { cn } from "@/lib/utils";

interface QueueTableProps {
  jobs: QueueJobView[];
  sortField?: QueueSortField;
  sortDirection?: QueueSortDirection;
  onSort?: (field: QueueSortField) => void;
  onAction?: (jobId: string, action: string, priority?: ExtractionPriority) => void;
  sortable?: boolean;
}

const priorityStyles: Record<ExtractionPriority, string> = {
  low: "border-border text-muted-foreground",
  normal: "border-border bg-muted/50 text-foreground",
  high: "border-brand/30 bg-brand/10 text-brand",
  critical: "border-red-500/30 bg-red-500/10 text-red-400",
};

function SortButton({
  label,
  field,
  sortField,
  sortDirection,
  onSort,
}: {
  label: string;
  field: QueueSortField;
  sortField?: QueueSortField;
  sortDirection?: QueueSortDirection;
  onSort?: (field: QueueSortField) => void;
}) {
  const isActive = sortField === field;
  const Icon = !isActive
    ? ArrowUpDown
    : sortDirection === "asc"
      ? ArrowUp
      : ArrowDown;

  return (
    <button
      type="button"
      onClick={() => onSort?.(field)}
      className="inline-flex items-center gap-1 text-left font-medium hover:text-foreground"
    >
      {label}
      <Icon
        className={cn(
          "size-3.5",
          isActive ? "text-brand" : "text-muted-foreground",
        )}
        aria-hidden
      />
    </button>
  );
}

export function QueueTable({
  jobs,
  sortField,
  sortDirection,
  onSort,
  onAction,
  sortable = true,
}: QueueTableProps) {
  if (jobs.length === 0) {
    return (
      <EmptyState
        title="No extraction jobs found"
        description="Try adjusting your search or filters, or queue a job from an approved import."
      />
    );
  }

  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>
              {sortable ? (
                <SortButton label="Job Name" field="name" sortField={sortField} sortDirection={sortDirection} onSort={onSort} />
              ) : (
                "Job Name"
              )}
            </TableHead>
            <TableHead>
              {sortable ? (
                <SortButton label="Platform" field="platform" sortField={sortField} sortDirection={sortDirection} onSort={onSort} />
              ) : (
                "Platform"
              )}
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead className="text-right">Records</TableHead>
            <TableHead className="text-right">Processed</TableHead>
            <TableHead className="min-w-[120px]">Progress</TableHead>
            <TableHead>
              {sortable ? (
                <SortButton label="Created" field="createdAt" sortField={sortField} sortDirection={sortDirection} onSort={onSort} />
              ) : (
                "Created"
              )}
            </TableHead>
            <TableHead>Duration</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id}>
              <TableCell className="max-w-[200px]">
                <div className="truncate font-medium">{job.name}</div>
              </TableCell>
              <TableCell>{getQueuePlatformLabel(job.platform)}</TableCell>
              <TableCell>
                <QueueStatusBadge status={job.status} />
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={priorityStyles[job.priority]}>
                  {getQueuePriorityLabel(job.priority)}
                </Badge>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {job.estimatedRecords.toLocaleString()}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {job.processedRecords.toLocaleString()}
              </TableCell>
              <TableCell>
                <QueueProgressBar
                  percent={job.progressPercent}
                  showLabel={false}
                  animated={job.status === "running" || job.status === "retrying"}
                />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatQueueDate(job.createdAt)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDuration(job.durationMs)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    nativeButton={false}
                    render={<Link href={`/queue/${job.id}`} />}
                  >
                    <Eye className="size-4" />
                  </Button>
                  {onAction ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon-sm">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onAction(job.id, "queue")}>
                          Queue Job
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAction(job.id, "pause")}>
                          Pause
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAction(job.id, "resume")}>
                          Resume
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAction(job.id, "retry")}>
                          Retry
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onAction(job.id, "set_priority", "high")}>
                          Set High Priority
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAction(job.id, "set_priority", "critical")}>
                          Set Critical Priority
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => onAction(job.id, "cancel")}
                        >
                          Cancel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
