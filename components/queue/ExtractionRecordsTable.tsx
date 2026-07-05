import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/imports/EmptyState";
import { formatQueueDate } from "@/lib/services/queueService";
import type { ExtractionRecordDocument, ExtractionRecordStatus } from "@/lib/types/queue";
import { cn } from "@/lib/utils";

interface ExtractionRecordsTableProps {
  records: ExtractionRecordDocument[];
}

const recordStatusStyles: Record<ExtractionRecordStatus, string> = {
  waiting: "border-border text-muted-foreground",
  queued: "border-brand/30 bg-brand/10 text-brand",
  running: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  completed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  failed: "border-red-500/30 bg-red-500/10 text-red-400",
  cancelled: "border-border bg-muted text-muted-foreground",
  retrying: "border-violet-500/30 bg-violet-500/10 text-violet-400",
};

export function ExtractionRecordsTable({ records }: ExtractionRecordsTableProps) {
  if (records.length === 0) {
    return (
      <EmptyState
        title="No extraction records"
        description="Records will be generated when an extraction job is created from an import job."
      />
    );
  }

  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Username</TableHead>
            <TableHead>Profile URL</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Attempts</TableHead>
            <TableHead>Started</TableHead>
            <TableHead>Completed</TableHead>
            <TableHead>Last Error</TableHead>
            <TableHead>Worker</TableHead>
            <TableHead className="text-right">Preview</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="font-medium">
                {record.username ? `@${record.username}` : "—"}
              </TableCell>
              <TableCell className="max-w-[200px] truncate text-muted-foreground">
                {record.profileUrl ?? "—"}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn("font-medium capitalize", recordStatusStyles[record.status])}
                >
                  {record.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right tabular-nums">{record.attempts}</TableCell>
              <TableCell className="text-muted-foreground">
                {record.startedAt ? formatQueueDate(record.startedAt) : "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {record.completedAt ? formatQueueDate(record.completedAt) : "—"}
              </TableCell>
              <TableCell className="max-w-[160px] truncate text-muted-foreground">
                {record.lastError ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {record.workerId ?? "—"}
              </TableCell>
              <TableCell className="text-right">
                {record.username && record.status === "completed" ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    nativeButton={false}
                    render={<Link href={`/profiles/${record.username}`} />}
                  >
                    View
                  </Button>
                ) : (
                  "—"
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
