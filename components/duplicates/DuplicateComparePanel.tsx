import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { NormalizedRecordDocument } from "@/lib/types/normalization";

interface DuplicateComparePanelProps {
  recordA: NormalizedRecordDocument;
  recordB: NormalizedRecordDocument;
  labelA?: string;
  labelB?: string;
}

function CompareRow({ label, valueA, valueB }: { label: string; valueA: string | null | undefined; valueB: string | null | undefined }) {
  const a = valueA ?? "—";
  const b = valueB ?? "—";
  const differs = a !== b;
  return (
    <div className="grid grid-cols-[120px_1fr_1fr] gap-3 border-b border-border py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={differs ? "text-foreground" : "text-muted-foreground"}>{a}</span>
      <span className={differs ? "text-brand" : "text-muted-foreground"}>{b}</span>
    </div>
  );
}

export function DuplicateComparePanel({
  recordA,
  recordB,
  labelA = "Record A",
  labelB = "Record B",
}: DuplicateComparePanelProps) {
  const coordsA = recordA.latitude != null ? `${recordA.latitude}, ${recordA.longitude}` : null;
  const coordsB = recordB.latitude != null ? `${recordB.latitude}, ${recordB.longitude}` : null;
  const locationA = [recordA.address, recordA.city, recordA.country].filter(Boolean).join(", ") || null;
  const locationB = [recordB.address, recordB.city, recordB.country].filter(Boolean).join(", ") || null;

  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Side-by-Side Comparison</CardTitle>
        <CardDescription>Compare both records before resolving the match</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-3 grid grid-cols-[120px_1fr_1fr] gap-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <span>Field</span>
          <span>{labelA}</span>
          <span>{labelB}</span>
        </div>
        <CompareRow label="Name" valueA={recordA.displayName} valueB={recordB.displayName} />
        <CompareRow label="Entity Type" valueA={recordA.entityType} valueB={recordB.entityType} />
        <CompareRow label="Username" valueA={recordA.username} valueB={recordB.username} />
        <CompareRow label="Website" valueA={recordA.website} valueB={recordB.website} />
        <CompareRow label="Email" valueA={recordA.publicEmail} valueB={recordB.publicEmail} />
        <CompareRow label="Phone" valueA={recordA.publicPhone} valueB={recordB.publicPhone} />
        <CompareRow label="Country" valueA={recordA.country} valueB={recordB.country} />
        <CompareRow label="City" valueA={recordA.city} valueB={recordB.city} />
        <CompareRow label="Address" valueA={locationA} valueB={locationB} />
        <CompareRow label="Coordinates" valueA={coordsA} valueB={coordsB} />
        <CompareRow label="Tags" valueA={recordA.tags.join(", ") || null} valueB={recordB.tags.join(", ") || null} />
        <CompareRow label="Vehicle Brands" valueA={recordA.vehicleBrands.join(", ") || null} valueB={recordB.vehicleBrands.join(", ") || null} />
        <CompareRow label="Specialties" valueA={recordA.specialties.join(", ") || null} valueB={recordB.specialties.join(", ") || null} />
        <CompareRow label="Source" valueA={recordA.source} valueB={recordB.source} />
        <CompareRow label="Confidence" valueA={String(recordA.confidenceScore)} valueB={String(recordB.confidenceScore)} />
        <CompareRow label="Created" valueA={recordA.normalizedAt} valueB={recordB.normalizedAt} />
      </CardContent>
    </Card>
  );
}
