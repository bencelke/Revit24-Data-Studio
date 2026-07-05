import { Badge } from "@/components/ui/badge";
import type { NormalizedRecordDocument } from "@/lib/types/normalization";
import { getEntityTypeLabel } from "@/lib/services/entityTypeService";
import { ConfidenceBadge } from "./ConfidenceBadge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface EntityHeaderProps {
  record: NormalizedRecordDocument;
}

export function EntityHeader({ record }: EntityHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold tracking-tight">{record.displayName}</h2>
          <Badge variant="outline">{getEntityTypeLabel(record.entityType)}</Badge>
          <ConfidenceBadge score={record.confidenceScore} />
        </div>
        <p className="text-sm text-muted-foreground">
          {record.username ? `@${record.username}` : "No username"} · {record.source}
        </p>
      </div>
      <Card className="border-border bg-card shadow-none sm:min-w-[200px]">
        <CardHeader className="pb-2">
          <CardDescription className="text-xs uppercase">Review Status</CardDescription>
          <CardTitle className="text-base capitalize">{record.status.replace("_", " ")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">v{record.workerVersion}</p>
        </CardContent>
      </Card>
    </div>
  );
}
