import type { GooglePlaceRawDocument } from "@/lib/types/google-places";
import type { NormalizationResult, RawExtractedMetadata } from "@/lib/types/normalization";
import {
  normalizeExtractedMetadata,
  runNormalizationPipeline,
} from "@/lib/services/normalizationPipeline";

export function googlePlaceToRaw(place: GooglePlaceRawDocument): RawExtractedMetadata {
  return {
    source: "google_places",
    sourceRecordId: place.id,
    displayName: place.name,
    username: place.placeId,
    bio: `${place.businessCategory} — ${place.formattedAddress}`,
    website: place.website,
    publicEmail: null,
    publicPhone: place.phone,
    profileUrl: place.googleMapsUrl,
    businessCategory: place.businessCategory,
    country: place.country,
    city: place.city,
    state: place.state,
    area: place.area,
    postalCode: place.postalCode,
    address: place.formattedAddress,
    latitude: place.latitude,
    longitude: place.longitude,
    verified: (place.rating ?? 0) >= 4.5,
  };
}

export async function normalizeGooglePlace(
  place: GooglePlaceRawDocument,
): Promise<NormalizationResult> {
  return runNormalizationPipeline(googlePlaceToRaw(place));
}

export function previewNormalizedPlace(place: GooglePlaceRawDocument) {
  return normalizeExtractedMetadata(googlePlaceToRaw(place));
}
