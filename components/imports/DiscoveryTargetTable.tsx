import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getDiscoveryPlatformLabel,
  getDiscoveryQueryTypeLabel,
  getDiscoveryStatusLabel,
} from "@/lib/services/instagramProfileImportService";
import type { DiscoveryTarget } from "@/lib/types/instagram-imports";
import { cn } from "@/lib/utils";
import { formatImportDate } from "@/lib/services/importService";

const statusStyles = {
  planned: "border-border text-muted-foreground",
  researching: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  ready: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  archived: "border-border bg-muted text-muted-foreground",
} as const;

interface DiscoveryTargetTableProps {
  targets: DiscoveryTarget[];
}

export function DiscoveryTargetTable({ targets }: DiscoveryTargetTableProps) {
  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Name</TableHead>
            <TableHead>Platform</TableHead>
            <TableHead>Query Type</TableHead>
            <TableHead>Query</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {targets.map((target) => (
            <TableRow key={target.id}>
              <TableCell className="font-medium">{target.name}</TableCell>
              <TableCell>{getDiscoveryPlatformLabel(target.platform)}</TableCell>
              <TableCell>
                {getDiscoveryQueryTypeLabel(target.queryType)}
              </TableCell>
              <TableCell className="max-w-48 truncate font-mono text-xs text-muted-foreground">
                {target.query}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {[target.city, target.country].filter(Boolean).join(", ") || "—"}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn("capitalize", statusStyles[target.status])}
                >
                  {getDiscoveryStatusLabel(target.status)}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatImportDate(target.createdAt)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="sm" disabled>
                    Notes
                  </Button>
                  <Button variant="ghost" size="sm" disabled>
                    Start Later
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
