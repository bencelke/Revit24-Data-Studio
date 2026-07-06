import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LocationPreview } from "@/components/maps/LocationPreview";
import { DuplicateIndicator } from "@/components/google-places/DuplicateIndicator";
import type { GooglePlaceRawDocument, PlacesDuplicateMatch } from "@/lib/types/google-places";

interface PlaceDetailsCardProps {
  place: GooglePlaceRawDocument;
  duplicates: PlacesDuplicateMatch[];
}

export function PlaceDetailsCard({ place, duplicates }: PlaceDetailsCardProps) {
  const reviewStatus =
    place.status === "imported" || place.status === "approved"
      ? "Approved for import"
      : place.status === "pending_review" || place.status === "queued"
        ? "Pending review"
        : place.status === "rejected"
          ? "Rejected"
          : place.status === "duplicate"
            ? "Marked duplicate"
            : "Discovered — not imported";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-border bg-card shadow-none">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle className="text-xl font-semibold">{place.name}</CardTitle>
              <CardDescription>{place.formattedAddress}</CardDescription>
            </div>
            {place.businessStatus ? (
              <Badge variant={place.businessStatus === "OPERATIONAL" ? "secondary" : "outline"}>
                {place.businessStatus}
              </Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="Category" value={place.businessCategory} />
          <Row label="Coordinates" value={`${place.latitude.toFixed(5)}, ${place.longitude.toFixed(5)}`} />
          <Row label="Phone" value={place.phone} />
          <Row label="Website" value={place.website} />
          <Row
            label="Rating"
            value={
              place.rating != null ? `${place.rating} (${place.reviewCount ?? 0} reviews)` : null
            }
          />
          <Row label="Google Place ID" value={place.placeId} />
          <Row label="Review Status" value={reviewStatus} />
          {place.openingHours.length > 0 ? (
            <div>
              <p className="text-muted-foreground">Opening Hours</p>
              <ul className="mt-1 space-y-0.5">
                {place.openingHours.map((hours) => (
                  <li key={hours}>{hours}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {place.photos.length > 0 ? (
            <div>
              <p className="text-muted-foreground">Photo References</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {place.photos.length} photo reference(s) stored (metadata only)
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <LocationPreview
        latitude={place.latitude}
        longitude={place.longitude}
        address={place.formattedAddress}
      />

      {place.photos.length === 0 ? (
        <Card className="border-border bg-card shadow-none lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Map</CardTitle>
            <CardDescription>Location preview — photo rendering deferred</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
              Map placeholder — {place.name}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {duplicates.length > 0 ? (
        <Card className="border-border bg-card shadow-none lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Potential Matches</CardTitle>
            <CardDescription>
              Compared by website, phone, coordinates, name, and Google Place ID
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {duplicates.map((match) => (
              <DuplicateIndicator key={`${match.placeId}-${match.matchedRecordId}`} match={match} />
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <span className="w-36 shrink-0 text-muted-foreground">{label}</span>
      <span className="break-all">{value ?? "—"}</span>
    </div>
  );
}
