import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { WebsiteRawDocument } from "@/lib/types/websites";
import type { CreateNormalizedRecordInput } from "@/lib/types/normalization";

interface WebsiteMetadataCardProps {
  website: WebsiteRawDocument;
  normalizationPreview?: CreateNormalizedRecordInput | null;
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-0.5">{value}</p>
    </div>
  );
}

export function WebsiteMetadataCard({ website, normalizationPreview }: WebsiteMetadataCardProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-border bg-card shadow-none">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Detected Metadata</CardTitle>
          <CardDescription>Public page metadata only</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="URL" value={website.url} />
          <Row label="Domain" value={website.domain} />
          <Row label="Title" value={website.title} />
          <Row label="Meta Description" value={website.metaDescription ?? undefined} />
          <Row label="Language" value={website.detectedLanguage ?? undefined} />
          <Row label="Business Type" value={website.detectedBusinessType ?? undefined} />
          <Row label="Contact Page" value={website.contactPage ?? undefined} />
          <Row label="About Page" value={website.aboutPage ?? undefined} />
          <Row label="Privacy Page" value={website.privacyPage ?? undefined} />
          {website.businessHours.length > 0 ? (
            <div>
              <p className="text-muted-foreground">Business Hours</p>
              <ul className="mt-1 space-y-0.5">
                {website.businessHours.map((hours) => (
                  <li key={hours}>{hours}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {normalizationPreview ? (
        <Card className="border-border bg-card shadow-none">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Normalization Preview</CardTitle>
            <CardDescription>Preview of entity pipeline output</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Display Name" value={normalizationPreview.displayName} />
            <Row label="Entity Type" value={normalizationPreview.entityType} />
            <Row label="Country" value={normalizationPreview.country ?? undefined} />
            <Row label="City" value={normalizationPreview.city ?? undefined} />
            <Row label="Confidence" value={String(normalizationPreview.confidenceScore)} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
