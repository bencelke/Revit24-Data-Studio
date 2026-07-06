import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PipelineEventDocument } from "@/lib/types/pipeline";
import { formatPipelineStage } from "@/lib/services/pipelineService";
import { PipelineStatusBadge } from "./PipelineStatusBadge";

interface PipelineEventsTableProps {
  events: PipelineEventDocument[];
}

function formatTime(value: string): string {
  return new Date(value).toLocaleString();
}

export function PipelineEventsTable({ events }: PipelineEventsTableProps) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No pipeline events logged.</p>
    );
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Timestamp</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Worker</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id}>
              <TableCell className="text-muted-foreground">{formatTime(event.timestamp)}</TableCell>
              <TableCell>{formatPipelineStage(event.stage)}</TableCell>
              <TableCell>
                <PipelineStatusBadge status={event.status} />
              </TableCell>
              <TableCell className="max-w-md truncate">{event.message}</TableCell>
              <TableCell>{event.duration != null ? `${event.duration}ms` : "—"}</TableCell>
              <TableCell>{event.worker ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
