import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PipelineJobDocument } from "@/lib/types/pipeline";
import { formatPipelineProvider } from "@/lib/services/pipelineService";
import { PipelineStatusBadge } from "./PipelineStatusBadge";
import { PipelineProgress } from "./PipelineProgress";

interface PipelineTableProps {
  jobs: PipelineJobDocument[];
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

export function PipelineTable({ jobs }: PipelineTableProps) {
  if (jobs.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
        No pipeline jobs yet. Start an import to create a unified pipeline job.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Provider</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Records</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id}>
              <TableCell className="font-medium">{formatPipelineProvider(job.provider)}</TableCell>
              <TableCell>
                <PipelineStatusBadge status={job.status} />
              </TableCell>
              <TableCell className="min-w-[200px]">
                <PipelineProgress job={job} />
              </TableCell>
              <TableCell>
                {job.successfulRecords}/{job.totalRecords}
              </TableCell>
              <TableCell className="text-muted-foreground">{formatDate(job.createdAt)}</TableCell>
              <TableCell className="text-right">
                <Link
                  href={`/pipeline/${job.id}`}
                  className="text-sm font-medium text-orange-400 hover:text-orange-300"
                >
                  View
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
