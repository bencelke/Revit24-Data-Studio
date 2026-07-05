import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { NormalizedRecordDocument } from "@/lib/types/normalization";
import { formatQueueDate } from "@/lib/services/queueService";

interface EntitySummaryProps {
  record: NormalizedRecordDocument;
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <span className="w-32 shrink-0 text-muted-foreground">{label}</span>
      <span className="break-all text-foreground">{value ?? "—"}</span>
    </div>
  );
}

export function EntitySummary({ record }: EntitySummaryProps) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Normalized Profile</CardTitle>
        <CardDescription>
          Structured at {formatQueueDate(record.normalizedAt)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <Row label="Display Name" value={record.displayName} />
        <Row label="Username" value={record.username ? `@${record.username}` : null} />
        <Row label="Website" value={record.website} />
        <Row label="Email" value={record.publicEmail} />
        <Row label="Phone" value={record.publicPhone} />
        <Row label="Country" value={record.country} />
        <Row label="City" value={record.city} />
        <Row label="Description" value={record.description} />
      </CardContent>
    </Card>
  );
}
