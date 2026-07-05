import { mockGooglePlacesStore } from "@/lib/mock-data/googlePlacesStore";
import { mockNormalizationStore } from "@/lib/mock-data/normalizationStore";
import { FirestoreNotConfiguredError } from "@/lib/errors/app-errors";
import { listNormalizedRecords as fetchNormalizedRecords } from "@/lib/repositories/normalizedRecordsRepository";
import { updateGooglePlace as persistUpdateGooglePlace } from "@/lib/repositories/googlePlacesRepository";
import { isFirestoreAvailable } from "@/lib/repositories/firestore-client";
import type { GooglePlaceRawDocument, PlacesDuplicateMatch } from "@/lib/types/google-places";
import type { NormalizedRecordDocument } from "@/lib/types/normalization";
import { listAllGooglePlaces } from "@/lib/services/placesSearchService";

function normalizeCompare(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function resolveLevel(score: number): PlacesDuplicateMatch["confidenceLevel"] {
  if (score >= 70) return "high";
  if (score >= 45) return "medium";
  if (score >= 25) return "low";
  return "possible";
}

function comparePlaceToPlace(
  source: GooglePlaceRawDocument,
  candidate: GooglePlaceRawDocument,
): PlacesDuplicateMatch | null {
  if (source.placeId === candidate.placeId) return null;

  const matchFields: string[] = [];
  let score = 0;

  if (normalizeCompare(source.website) === normalizeCompare(candidate.website) && source.website) {
    matchFields.push("website");
    score += 30;
  }
  if (normalizeCompare(source.phone) === normalizeCompare(candidate.phone) && source.phone) {
    matchFields.push("phone");
    score += 25;
  }
  if (
    normalizeCompare(source.name) === normalizeCompare(candidate.name) &&
    normalizeCompare(source.city) === normalizeCompare(candidate.city)
  ) {
    matchFields.push("businessName");
    matchFields.push("city");
    score += 20;
  } else {
    if (normalizeCompare(source.city) === normalizeCompare(candidate.city) && source.city) {
      matchFields.push("city");
      score += 10;
    }
    const left = normalizeCompare(source.name);
    const right = normalizeCompare(candidate.name);
    if (left && right && (left.includes(right) || right.includes(left))) {
      matchFields.push("businessName");
      score += 15;
    }
  }

  const distance = haversineKm(
    source.latitude,
    source.longitude,
    candidate.latitude,
    candidate.longitude,
  );
  if (distance < 0.05) {
    matchFields.push("coordinates");
    score += 20;
  }

  if (matchFields.length === 0) return null;

  return {
    placeId: candidate.placeId,
    matchedName: candidate.name,
    matchFields,
    confidenceScore: Math.min(100, score),
    confidenceLevel: resolveLevel(score),
    matchedRecordId: candidate.id,
    matchedSource: "google_places_raw",
  };
}

function comparePlaceToNormalized(
  source: GooglePlaceRawDocument,
  candidate: NormalizedRecordDocument,
): PlacesDuplicateMatch | null {
  const matchFields: string[] = [];
  let score = 0;

  if (normalizeCompare(source.website) === normalizeCompare(candidate.website) && source.website) {
    matchFields.push("website");
    score += 30;
  }
  if (normalizeCompare(source.phone) === normalizeCompare(candidate.publicPhone) && source.phone) {
    matchFields.push("phone");
    score += 25;
  }
  if (
    normalizeCompare(source.name) === normalizeCompare(candidate.displayName) &&
    normalizeCompare(source.city) === normalizeCompare(candidate.city)
  ) {
    matchFields.push("businessName");
    matchFields.push("city");
    score += 20;
  }

  if (
    candidate.latitude != null &&
    candidate.longitude != null &&
    haversineKm(source.latitude, source.longitude, candidate.latitude, candidate.longitude) < 0.05
  ) {
    matchFields.push("coordinates");
    score += 20;
  }

  if (matchFields.length === 0) return null;

  return {
    placeId: candidate.id,
    matchedName: candidate.displayName,
    matchFields,
    confidenceScore: Math.min(100, score),
    confidenceLevel: resolveLevel(score),
    matchedRecordId: candidate.id,
    matchedSource: "normalized_records",
  };
}

async function loadNormalizedRecords(): Promise<NormalizedRecordDocument[]> {
  if (isFirestoreAvailable()) {
    try {
      return await fetchNormalizedRecords();
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return mockNormalizationStore.listRecords();
      }
      throw error;
    }
  }
  return mockNormalizationStore.listRecords();
}

export async function findPlaceDuplicates(
  place: GooglePlaceRawDocument,
): Promise<PlacesDuplicateMatch[]> {
  const [allPlaces, normalizedRecords] = await Promise.all([
    listAllGooglePlaces(),
    loadNormalizedRecords(),
  ]);

  const matches: PlacesDuplicateMatch[] = [];

  for (const candidate of allPlaces) {
    const match = comparePlaceToPlace(place, candidate);
    if (match) matches.push(match);
  }

  for (const candidate of normalizedRecords) {
    const match = comparePlaceToNormalized(place, candidate);
    if (match) matches.push(match);
  }

  return matches.sort((a, b) => b.confidenceScore - a.confidenceScore).slice(0, 5);
}

export async function updatePlaceStatus(
  id: string,
  status: GooglePlaceRawDocument["status"],
): Promise<void> {
  if (isFirestoreAvailable()) {
    try {
      await persistUpdateGooglePlace(id, { status });
      return;
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        mockGooglePlacesStore.updatePlace(id, { status });
        return;
      }
      throw error;
    }
  }
  mockGooglePlacesStore.updatePlace(id, { status });
}

export { haversineKm, resolveLevel as resolveDuplicateLevel };
