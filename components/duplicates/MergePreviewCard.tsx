import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CreateNormalizedRecordInputPreview } from "@/lib/types/duplicates";

interface MergePreviewCardProps {
  preview: CreateNormalizedRecordInputPreview;
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}

export function MergePreviewCard({ preview }: MergePreviewCardProps) {
  const location = [preview.address, preview.city, preview.state, preview.country]
    .filter(Boolean)
    .join(", ");

  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Merge Preview</CardTitle>
        <CardDescription>Canonical record after merge — original records preserved</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Row label="Display Name" value={preview.displayName} />
        <Row label="Entity Type" value={preview.entityType} />
        <Row label="Username" value={preview.username} />
        <Row label="Website" value={preview.website} />
        <Row label="Email" value={preview.publicEmail} />
        <Row label="Phone" value={preview.publicPhone} />
        <Row label="Location" value={location || null} />
        <Row label="Description" value={preview.description} />
        {preview.tags.length > 0 ? <Row label="Tags" value={preview.tags.join(", ")} /> : null}
        {preview.vehicleBrands.length > 0 ? (
          <Row label="Vehicle Brands" value={preview.vehicleBrands.join(", ")} />
        ) : null}
        {preview.specialties.length > 0 ? (
          <Row label="Specialties" value={preview.specialties.join(", ")} />
        ) : null}
      </CardContent>
    </Card>
  );
}
