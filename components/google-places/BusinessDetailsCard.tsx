import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LocationPreview } from "@/components/maps/LocationPreview";
import { DuplicateIndicator } from "./DuplicateIndicator";
import type { GooglePlaceRawDocument, PlacesDuplicateMatch } from "@/lib/types/google-places";

interface BusinessDetailsCardProps {
  place: GooglePlaceRawDocument;
  duplicates: PlacesDuplicateMatch[];
}

export function BusinessDetailsCard({ place, duplicates }: BusinessDetailsCardProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-border bg-card shadow-none">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">{place.name}</CardTitle>
          <CardDescription>{place.formattedAddress}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="Category" value={place.businessCategory} />
          <Row label="Phone" value={place.phone} />
          <Row label="Website" value={place.website} />
          <Row label="Rating" value={place.rating != null ? `${place.rating} (${place.reviewCount ?? 0} reviews)` : null} />
          <Row label="Import Status" value={place.status} />
          <Row label="Place ID" value={place.placeId} />
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
        </CardContent>
      </Card>

      <LocationPreview
        latitude={place.latitude}
        longitude={place.longitude}
        address={place.formattedAddress}
      />

      {place.photos.length > 0 ? null : (
        <Card className="border-border bg-card shadow-none lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Photos</CardTitle>
            <CardDescription>Photo rendering deferred in this phase</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
              Photos placeholder — {place.name}
            </div>
          </CardContent>
        </Card>
      )}

      {duplicates.length > 0 ? (
        <Card className="border-border bg-card shadow-none lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Potential Duplicate Matches</CardTitle>
            <CardDescription>Detection only — no automatic merge</CardDescription>
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
      <span className="w-32 shrink-0 text-muted-foreground">{label}</span>
      <span className="break-all">{value ?? "—"}</span>
    </div>
  );
}
