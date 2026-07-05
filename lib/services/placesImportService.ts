import { mockGooglePlacesStore } from "@/lib/mock-data/googlePlacesStore";
import { FirestoreNotConfiguredError } from "@/lib/errors/app-errors";
import {
  createImportJob as persistImportJob,
} from "@/lib/repositories/importJobsRepository";
import { createImportRecords as persistImportRecords } from "@/lib/repositories/importRecordsRepository";
import { isFirestoreAvailable } from "@/lib/repositories/firestore-client";
import { createExtractionJobFromImportJob } from "@/lib/services/queueService";
import { normalizeGooglePlace } from "@/lib/services/placesNormalizationService";
import { findPlaceDuplicates, updatePlaceStatus } from "@/lib/services/placesDuplicateService";
import { getGooglePlace as fetchGooglePlace } from "@/lib/repositories/googlePlacesRepository";
import type { GooglePlaceRawDocument, PlacesImportResult } from "@/lib/types/google-places";
import { createDefaultReviewFields } from "@/lib/types/review";
import { mockImportJobStore } from "@/lib/mock-data/importJobStore";

const GOOGLE_PLACES_JOB_TYPE = "google_places_search";
const GOOGLE_PLACES_SOURCE = "google_places";
const CREATED_BY = "system-dev";

async function getPlace(id: string): Promise<GooglePlaceRawDocument | null> {
  if (isFirestoreAvailable()) {
    try {
      return await fetchGooglePlace(id);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return mockGooglePlacesStore.getPlace(id);
      }
      throw error;
    }
  }
  return mockGooglePlacesStore.getPlace(id);
}

export async function importSelectedPlaces(
  placeIds: string[],
  action: "import" | "queue" | "reject" | "duplicate" = "import",
): Promise<PlacesImportResult> {
  const result: PlacesImportResult = {
    imported: 0,
    queued: 0,
    rejected: 0,
    duplicates: 0,
    failed: 0,
  };

  if (placeIds.length === 0) return result;

  const timestamp = new Date().toISOString();
  const validPlaces: GooglePlaceRawDocument[] = [];

  for (const id of placeIds) {
    const place = await getPlace(id);
    if (!place) {
      result.failed += 1;
      continue;
    }

    if (action === "reject") {
      await updatePlaceStatus(id, "rejected");
      result.rejected += 1;
      continue;
    }

    if (action === "duplicate") {
      await updatePlaceStatus(id, "duplicate");
      result.duplicates += 1;
      continue;
    }

    const dupes = await findPlaceDuplicates(place);
    if (dupes.some((match) => match.confidenceLevel === "high")) {
      await updatePlaceStatus(id, "duplicate");
      result.duplicates += 1;
      continue;
    }

    validPlaces.push(place);
  }

  if (validPlaces.length === 0 || action === "reject" || action === "duplicate") {
    return result;
  }

  const jobInput = {
    name: `Google Places Import — ${validPlaces.length} businesses`,
    type: GOOGLE_PLACES_JOB_TYPE,
    source: GOOGLE_PLACES_SOURCE,
    status: "pending_review" as const,
    createdBy: CREATED_BY,
    createdAt: timestamp,
    updatedAt: timestamp,
    totalRecords: validPlaces.length,
    validRecords: validPlaces.length,
    duplicateRecords: 0,
    invalidRecords: 0,
    notes: "Imported from Google Places discovery",
    metadata: { source: "google_places_discovery" },
  };

  let importJobId: string;

  if (isFirestoreAvailable()) {
    try {
      const job = await persistImportJob(jobInput);
      importJobId = job.id;
      await persistImportRecords(
        validPlaces.map((place) => ({
          jobId: job.id,
          originalInput: place.googleMapsUrl,
          username: place.placeId,
          profileUrl: place.googleMapsUrl,
          status: "valid" as const,
          error: null,
          duplicateOf: null,
          createdAt: timestamp,
          updatedAt: timestamp,
          ...createDefaultReviewFields("valid", GOOGLE_PLACES_SOURCE),
          displayName: place.name,
          website: place.website,
          publicEmail: null,
          description: place.businessCategory,
          country: place.country,
          city: place.city,
        })),
      );
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        const job = mockImportJobStore.createImportJob(jobInput);
        importJobId = job.id;
        mockImportJobStore.createImportRecords(
          validPlaces.map((place) => ({
            jobId: job.id,
            originalInput: place.googleMapsUrl,
            username: place.placeId,
            profileUrl: place.googleMapsUrl,
            status: "valid" as const,
            error: null,
            duplicateOf: null,
            createdAt: timestamp,
            updatedAt: timestamp,
            ...createDefaultReviewFields("valid", GOOGLE_PLACES_SOURCE),
            displayName: place.name,
            website: place.website,
            publicEmail: null,
            description: place.businessCategory,
            country: place.country,
            city: place.city,
          })),
        );
      } else {
        throw error;
      }
    }
  } else {
    const job = mockImportJobStore.createImportJob(jobInput);
    importJobId = job.id;
    mockImportJobStore.createImportRecords(
      validPlaces.map((place) => ({
        jobId: job.id,
        originalInput: place.googleMapsUrl,
        username: place.placeId,
        profileUrl: place.googleMapsUrl,
        status: "valid" as const,
        error: null,
        duplicateOf: null,
        createdAt: timestamp,
        updatedAt: timestamp,
        ...createDefaultReviewFields("valid", GOOGLE_PLACES_SOURCE),
        displayName: place.name,
        website: place.website,
        publicEmail: null,
        description: place.businessCategory,
        country: place.country,
        city: place.city,
      })),
    );
  }

  for (const place of validPlaces) {
    try {
      await normalizeGooglePlace(place);
      if (action === "queue") {
        await updatePlaceStatus(place.id, "queued");
        result.queued += 1;
      } else {
        await updatePlaceStatus(place.id, "imported");
        result.imported += 1;
      }
    } catch {
      result.failed += 1;
    }
  }

  if (action === "queue" && importJobId!) {
    try {
      await createExtractionJobFromImportJob(importJobId);
    } catch {
      // Queue creation is best-effort
    }
  }

  return result;
}

export async function importSinglePlace(placeId: string): Promise<PlacesImportResult> {
  return importSelectedPlaces([placeId], "import");
}
