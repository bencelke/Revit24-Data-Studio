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
import type { InstagramProfileInput } from "@/lib/types/instagram-imports";
import { cn } from "@/lib/utils";

interface InstagramPreviewTableProps {
  rows: InstagramProfileInput[];
}

const statusStyles = {
  valid: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  duplicate: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  invalid: "border-red-500/30 bg-red-500/10 text-red-400",
} as const;

export function InstagramPreviewTable({ rows }: InstagramPreviewTableProps) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No preview yet"
        description="Paste Instagram profile links or usernames, then click Preview Import."
      />
    );
  }

  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Line</TableHead>
            <TableHead>Original Input</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Profile URL</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Error</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={`${row.lineNumber}-${row.originalInput}`}>
              <TableCell className="text-muted-foreground">
                {row.lineNumber}
              </TableCell>
              <TableCell className="max-w-48 truncate font-mono text-xs">
                {row.originalInput.trim() || "(empty)"}
              </TableCell>
              <TableCell>{row.username ?? "—"}</TableCell>
              <TableCell className="max-w-56 truncate text-muted-foreground">
                {row.profileUrl ?? "—"}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn("capitalize", statusStyles[row.status])}
                >
                  {row.status}
                </Badge>
              </TableCell>
              <TableCell className="max-w-64 text-muted-foreground">
                {row.status === "duplicate" && row.duplicateOf
                  ? `Duplicate of: ${row.duplicateOf}`
                  : (row.error ?? "—")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
