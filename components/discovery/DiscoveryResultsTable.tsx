import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { DiscoveryResultDocument } from "@/lib/types/discovery-engine";
import {
  formatDiscoveryProvider,
  formatEntityType,
} from "@/lib/services/keywordGenerationService";

interface DiscoveryResultsTableProps {
  results: DiscoveryResultDocument[];
}

export function DiscoveryResultsTable({ results }: DiscoveryResultsTableProps) {
  if (results.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
        No discovery results yet.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Confidence</TableHead>
            <TableHead>Flags</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result) => (
            <TableRow key={result.id}>
              <TableCell className="font-medium">{result.name}</TableCell>
              <TableCell>{formatDiscoveryProvider(result.source)}</TableCell>
              <TableCell className="max-w-[200px] truncate text-muted-foreground">
                {result.url}
              </TableCell>
              <TableCell>{formatEntityType(result.entityType)}</TableCell>
              <TableCell>
                {[result.city, result.country].filter(Boolean).join(", ") || "—"}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {result.status}
                </Badge>
              </TableCell>
              <TableCell className="capitalize">{result.confidence}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {result.isDuplicate ? (
                    <Badge variant="outline" className="text-xs">
                      Dup
                    </Badge>
                  ) : null}
                  {result.isQueued ? (
                    <Badge variant="outline" className="text-xs text-orange-400">
                      Queued
                    </Badge>
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
