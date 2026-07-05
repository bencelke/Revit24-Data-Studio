import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "./EmptyState";
import { formatImportDate } from "@/lib/services/importService";
import type { ImportRecordDocument } from "@/lib/types/import-jobs";
import { cn } from "@/lib/utils";

interface InstagramImportRecordsTableProps {
  records: ImportRecordDocument[];
}

const statusStyles = {
  valid: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  duplicate: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  invalid: "border-red-500/30 bg-red-500/10 text-red-400",
} as const;

export function InstagramImportRecordsTable({
  records,
}: InstagramImportRecordsTableProps) {
  if (records.length === 0) {
    return (
      <EmptyState
        title="No records"
        description="This import job does not contain any profile records."
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
            <TableHead>Original Input</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Error</TableHead>
            <TableHead>Duplicate Of</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="font-medium">
                {record.username ?? "—"}
              </TableCell>
              <TableCell className="max-w-48 truncate text-muted-foreground">
                {record.profileUrl ?? "—"}
              </TableCell>
              <TableCell className="max-w-48 truncate font-mono text-xs">
                {record.originalInput.trim() || "—"}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn("capitalize", statusStyles[record.status])}
                >
                  {record.status}
                </Badge>
              </TableCell>
              <TableCell className="max-w-48 text-muted-foreground">
                {record.error ?? "—"}
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {record.duplicateOf ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatImportDate(record.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
