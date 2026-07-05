import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { MergeHistoryDocument } from "@/lib/types/duplicates";
import { formatImportDate } from "@/lib/services/importService";

interface MergeHistoryTimelineProps {
  history: MergeHistoryDocument[];
}

export function MergeHistoryTimeline({ history }: MergeHistoryTimelineProps) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Merge History</CardTitle>
        <CardDescription>Audit trail — all resolution actions</CardDescription>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">No resolution actions yet.</p>
        ) : (
          <ol className="relative space-y-4 border-l border-border pl-4">
            {history.map((entry) => (
              <li key={entry.id} className="relative">
                <span className="absolute -left-[21px] top-1 size-2.5 rounded-full bg-brand" />
                <div className="space-y-1">
                  <p className="text-sm font-medium capitalize">{entry.action.replace(/_/g, " ")}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatImportDate(entry.performedAt)} · {entry.performedBy}
                  </p>
                  {entry.notes ? (
                    <p className="text-sm text-muted-foreground">{entry.notes}</p>
                  ) : null}
                  {entry.resultRecordId ? (
                    <p className="text-xs text-brand">Result record: {entry.resultRecordId}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
