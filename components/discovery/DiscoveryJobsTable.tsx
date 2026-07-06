import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { DiscoveryJobDocument } from "@/lib/types/discovery-engine";
import { formatDiscoveryProvider } from "@/lib/services/keywordGenerationService";
import { Progress } from "@/components/ui/progress";

interface DiscoveryJobsTableProps {
  jobs: DiscoveryJobDocument[];
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

function formatDuration(ms: number | null): string {
  if (ms == null) return "—";
  const minutes = Math.round(ms / 60000);
  return minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export function DiscoveryJobsTable({ jobs }: DiscoveryJobsTableProps) {
  if (jobs.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
        No discovery jobs yet. Create a campaign and run discovery.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Campaign</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Results</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id}>
              <TableCell className="font-medium">{job.campaignName}</TableCell>
              <TableCell>{formatDiscoveryProvider(job.provider)}</TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {job.status}
                </Badge>
              </TableCell>
              <TableCell className="min-w-[120px]">
                <div className="space-y-1">
                  <Progress value={job.progress} className="h-1.5" />
                  <span className="text-xs text-muted-foreground">{job.progress}%</span>
                </div>
              </TableCell>
              <TableCell>
                {job.processedResults}/{job.totalResults}
              </TableCell>
              <TableCell>{formatDuration(job.durationMs)}</TableCell>
              <TableCell className="text-muted-foreground">{formatDate(job.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
