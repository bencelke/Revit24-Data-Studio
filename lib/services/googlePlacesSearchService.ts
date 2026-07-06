import { mockGooglePlacesStore, mockPlacesSearchJobsStore } from "@/lib/mock-data/googlePlacesStore";
import { FirestoreNotConfiguredError } from "@/lib/errors/app-errors";
import { isGooglePlacesEnabled, shouldUseGooglePlacesMock } from "@/lib/config/google-places";
import {
  createGooglePlaces as persistGooglePlaces,
  listGooglePlacesByJobId as fetchGooglePlacesByJobId,
} from "@/lib/repositories/googlePlacesRepository";
import {
  createPlacesSearchJob as persistSearchJob,
  getPlacesSearchJob as fetchSearchJob,
  updatePlacesSearchJob as persistUpdateSearchJob,
} from "@/lib/repositories/placesSearchJobsRepository";
import { isFirestoreAvailable } from "@/lib/repositories/firestore-client";
import {
  defaultGooglePlacesProductionProvider,
} from "@/lib/services/googlePlacesProvider";
import { getBusinessDiscoveryProvider } from "@/lib/services/googlePlacesService";
import type {
  GooglePlaceRawDocument,
  PlacesSearchJobDocument,
  PlacesSearchQuery,
} from "@/lib/types/google-places";

const CREATED_BY = "system-dev";

async function saveSearchJob(
  input: Omit<PlacesSearchJobDocument, "id">,
): Promise<PlacesSearchJobDocument> {
  if (isFirestoreAvailable()) {
    try {
      return await persistSearchJob(input);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return mockPlacesSearchJobsStore.createJob(input);
      }
      throw error;
    }
  }
  return mockPlacesSearchJobsStore.createJob(input);
}

async function updateSearchJob(
  id: string,
  data: Partial<PlacesSearchJobDocument>,
): Promise<void> {
  if (isFirestoreAvailable()) {
    try {
      await persistUpdateSearchJob(id, data);
      return;
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        mockPlacesSearchJobsStore.updateJob(id, data);
        return;
      }
      throw error;
    }
  }
  mockPlacesSearchJobsStore.updateJob(id, data);
}

async function getSearchJob(id: string): Promise<PlacesSearchJobDocument | null> {
  if (isFirestoreAvailable()) {
    try {
      return await fetchSearchJob(id);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return mockPlacesSearchJobsStore.getJob(id);
      }
      throw error;
    }
  }
  return mockPlacesSearchJobsStore.getJob(id);
}

async function savePlaces(
  places: Omit<GooglePlaceRawDocument, "id">[],
  jobId: string,
): Promise<GooglePlaceRawDocument[]> {
  const inputs = places.map((place) => ({ ...place, searchJobId: jobId }));
  if (isFirestoreAvailable()) {
    try {
      return await persistGooglePlaces(inputs);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return mockGooglePlacesStore.createPlaces(inputs);
      }
      throw error;
    }
  }
  return mockGooglePlacesStore.createPlaces(inputs);
}

function resolveSearchType(query: PlacesSearchQuery): PlacesSearchJobDocument["searchType"] {
  if (query.searchType) return query.searchType;
  if (query.latitude != null && query.longitude != null) return "nearby";
  return "text";
}

export async function executeGooglePlacesSearch(
  query: PlacesSearchQuery,
  options?: {
    clonedFromJobId?: string | null;
    scheduledAt?: string | null;
  },
): Promise<{ job: PlacesSearchJobDocument; places: GooglePlaceRawDocument[] }> {
  const timestamp = new Date().toISOString();
  const searchType = resolveSearchType(query);

  const job = await saveSearchJob({
    status: options?.scheduledAt ? "pending" : "running",
    query,
    createdBy: CREATED_BY,
    createdAt: timestamp,
    completedAt: null,
    totalResults: 0,
    importedResults: 0,
    failedResults: 0,
    scheduledAt: options?.scheduledAt ?? null,
    clonedFromJobId: options?.clonedFromJobId ?? null,
    searchType,
    errorMessage: null,
  });

  if (options?.scheduledAt) {
    return { job, places: [] };
  }

  try {
    let places: Omit<GooglePlaceRawDocument, "id">[] = [];
    let errorMessage: string | null = null;

    if (isGooglePlacesEnabled()) {
      const result = await defaultGooglePlacesProductionProvider.executeSearch({
        ...query,
        jobId: job.id,
      });

      if (result.error && result.places.length === 0) {
        errorMessage = result.error.message;
        if (result.error.code !== "NO_RESULTS") {
          throw new Error(result.error.message);
        }
      }

      places = result.places.map((place) => ({
        ...place,
        businessStatus: place.businessStatus ?? null,
      }));
    } else if (shouldUseGooglePlacesMock()) {
      const provider = getBusinessDiscoveryProvider("google_places");
      const mockResult = await provider.search({
        ...query,
        resultLimit: query.resultLimit ?? 20,
        language: query.language ?? "en",
      });
      places = mockResult.places.map((place) => ({
        ...place,
        businessStatus: place.businessStatus ?? "OPERATIONAL",
        searchJobId: job.id,
      }));
    }

    const saved = await savePlaces(places, job.id);
    const completedAt = new Date().toISOString();

    await updateSearchJob(job.id, {
      status: errorMessage === "No places found for this search." ? "completed" : "completed",
      completedAt,
      totalResults: saved.length,
      errorMessage,
    });

    return {
      job: {
        ...job,
        status: "completed",
        completedAt,
        totalResults: saved.length,
        errorMessage,
      },
      places: saved,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed.";
    await updateSearchJob(job.id, {
      status: "failed",
      completedAt: new Date().toISOString(),
      failedResults: 1,
      errorMessage: message,
    });
    throw error;
  }
}

export async function rerunGooglePlacesSearch(
  jobId: string,
): Promise<{ job: PlacesSearchJobDocument; places: GooglePlaceRawDocument[] }> {
  const existing = await getSearchJob(jobId);
  if (!existing) {
    throw new Error("Search job not found.");
  }
  return executeGooglePlacesSearch(existing.query, { clonedFromJobId: jobId });
}

export async function cloneGooglePlacesSearch(
  jobId: string,
): Promise<PlacesSearchJobDocument> {
  const existing = await getSearchJob(jobId);
  if (!existing) {
    throw new Error("Search job not found.");
  }
  const { job } = await executeGooglePlacesSearch(existing.query, {
    clonedFromJobId: jobId,
  });
  return job;
}

export async function scheduleGooglePlacesSearchLater(
  query: PlacesSearchQuery,
  scheduledAt: string,
): Promise<PlacesSearchJobDocument> {
  const { job } = await executeGooglePlacesSearch(query, { scheduledAt });
  return job;
}

export async function listPlacesForJob(jobId: string): Promise<GooglePlaceRawDocument[]> {
  if (isFirestoreAvailable()) {
    try {
      return await fetchGooglePlacesByJobId(jobId);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return mockGooglePlacesStore.listPlacesByJobId(jobId);
      }
      throw error;
    }
  }
  return mockGooglePlacesStore.listPlacesByJobId(jobId);
}
