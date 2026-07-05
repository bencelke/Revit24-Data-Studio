import { mockGooglePlacesStore, mockPlacesSearchJobsStore, mockSavedSearchStore } from "@/lib/mock-data/googlePlacesStore";
import { FirestoreNotConfiguredError, MOCK_MODE_WARNING } from "@/lib/errors/app-errors";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { isGooglePlacesApiConfigured } from "@/lib/config/google-places";
import {
  createGooglePlaces as persistGooglePlaces,
  listGooglePlaces as fetchGooglePlaces,
  listGooglePlacesByJobId as fetchGooglePlacesByJobId,
  getGooglePlace as fetchGooglePlace,
  getGooglePlaceByPlaceId as fetchGooglePlaceByPlaceId,
} from "@/lib/repositories/googlePlacesRepository";
import {
  createPlacesSearchJob as persistSearchJob,
  getPlacesSearchJob as fetchSearchJob,
  listPlacesSearchJobs as fetchSearchJobs,
  updatePlacesSearchJob as persistUpdateSearchJob,
} from "@/lib/repositories/placesSearchJobsRepository";
import {
  createSavedSearch as persistSavedSearch,
  listSavedSearches as fetchSavedSearches,
  deleteSavedSearch as persistDeleteSavedSearch,
} from "@/lib/repositories/savedSearchRepository";
import { isFirestoreAvailable } from "@/lib/repositories/firestore-client";
import { getBusinessDiscoveryProvider } from "@/lib/services/googlePlacesService";
import type {
  CreateSavedSearchInput,
  GooglePlaceRawDocument,
  PlacesSearchJobDocument,
  PlacesSearchPageData,
  PlacesSearchQuery,
  PlacesResultsPageData,
  PlaceDetailPageData,
  SavedSearchDocument,
} from "@/lib/types/google-places";
import { findPlaceDuplicates } from "@/lib/services/placesDuplicateService";

const CREATED_BY = "system-dev";

async function loadSavedSearches(): Promise<SavedSearchDocument[]> {
  if (isFirestoreAvailable()) {
    try {
      return await fetchSavedSearches();
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return mockSavedSearchStore.listSearches();
      }
      throw error;
    }
  }
  return mockSavedSearchStore.listSearches();
}

async function loadSearchJobs(): Promise<PlacesSearchJobDocument[]> {
  if (isFirestoreAvailable()) {
    try {
      return await fetchSearchJobs();
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return mockPlacesSearchJobsStore.listJobs();
      }
      throw error;
    }
  }
  return mockPlacesSearchJobsStore.listJobs();
}

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

export async function runPlacesSearch(
  query: PlacesSearchQuery,
): Promise<{ job: PlacesSearchJobDocument; places: GooglePlaceRawDocument[] }> {
  const timestamp = new Date().toISOString();
  const provider = getBusinessDiscoveryProvider("google_places");

  const job = await saveSearchJob({
    status: "running",
    query,
    createdBy: CREATED_BY,
    createdAt: timestamp,
    completedAt: null,
    totalResults: 0,
    importedResults: 0,
    failedResults: 0,
  });

  try {
    const result = await provider.search({
      ...query,
      resultLimit: query.resultLimit ?? 20,
      language: query.language ?? "en",
    });

    const places = await savePlaces(result.places, job.id);
    const completedAt = new Date().toISOString();

    const update = {
      status: "completed" as const,
      completedAt,
      totalResults: places.length,
    };

    if (isFirestoreAvailable()) {
      try {
        await persistUpdateSearchJob(job.id, update);
      } catch (error) {
        if (error instanceof FirestoreNotConfiguredError) {
          mockPlacesSearchJobsStore.updateJob(job.id, update);
        } else {
          throw error;
        }
      }
    } else {
      mockPlacesSearchJobsStore.updateJob(job.id, update);
    }

    return {
      job: { ...job, ...update },
      places,
    };
  } catch (error) {
    const failedAt = new Date().toISOString();
    const failUpdate = { status: "failed" as const, completedAt: failedAt, failedResults: 1 };
    if (isFirestoreAvailable()) {
      try {
        await persistUpdateSearchJob(job.id, failUpdate);
      } catch {
        mockPlacesSearchJobsStore.updateJob(job.id, failUpdate);
      }
    } else {
      mockPlacesSearchJobsStore.updateJob(job.id, failUpdate);
    }
    throw error;
  }
}

export async function savePlacesSearch(input: {
  name: string;
  query: PlacesSearchQuery;
}): Promise<SavedSearchDocument> {
  const payload: CreateSavedSearchInput = {
    name: input.name,
    country: input.query.country,
    state: input.query.state,
    city: input.query.city,
    area: input.query.area,
    keyword: input.query.keyword,
    category: input.query.category,
    radius: input.query.radius,
    createdBy: CREATED_BY,
    createdAt: new Date().toISOString(),
  };

  if (isFirestoreAvailable()) {
    try {
      return await persistSavedSearch(payload);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return mockSavedSearchStore.createSearch(payload);
      }
      throw error;
    }
  }
  return mockSavedSearchStore.createSearch(payload);
}

export async function deletePlacesSavedSearch(id: string): Promise<void> {
  if (isFirestoreAvailable()) {
    try {
      await persistDeleteSavedSearch(id);
      return;
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        mockSavedSearchStore.deleteSearch(id);
        return;
      }
      throw error;
    }
  }
  mockSavedSearchStore.deleteSearch(id);
}

export async function getPlacesSearchPageData(): Promise<PlacesSearchPageData> {
  const firebaseConfigured = isFirebaseConfigured();
  const useFirestore = isFirestoreAvailable();
  const googlePlacesConfigured = isGooglePlacesApiConfigured();

  return {
    savedSearches: await loadSavedSearches(),
    recentJobs: (await loadSearchJobs()).slice(0, 10),
    dataMode: useFirestore ? "firestore" : "mock",
    firebaseConfigured,
    googlePlacesConfigured,
    warning: useFirestore
      ? googlePlacesConfigured
        ? undefined
        : "Google Places API Not Configured — using mock automotive business data."
      : MOCK_MODE_WARNING,
  };
}

export async function getPlacesResultsPageData(
  jobId: string,
): Promise<PlacesResultsPageData | null> {
  const firebaseConfigured = isFirebaseConfigured();
  const useFirestore = isFirestoreAvailable();
  const googlePlacesConfigured = isGooglePlacesApiConfigured();

  let job: PlacesSearchJobDocument | null;
  let places: GooglePlaceRawDocument[];

  if (isFirestoreAvailable()) {
    try {
      job = await fetchSearchJob(jobId);
      places = job ? await fetchGooglePlacesByJobId(jobId) : [];
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        job = mockPlacesSearchJobsStore.getJob(jobId);
        places = job ? mockGooglePlacesStore.listPlacesByJobId(jobId) : [];
      } else {
        throw error;
      }
    }
  } else {
    job = mockPlacesSearchJobsStore.getJob(jobId);
    places = job ? mockGooglePlacesStore.listPlacesByJobId(jobId) : [];
  }

  if (!job) return null;

  return {
    job,
    places,
    dataMode: useFirestore ? "firestore" : "mock",
    firebaseConfigured,
    googlePlacesConfigured,
  };
}

export async function getPlaceDetailPageData(
  placeId: string,
): Promise<PlaceDetailPageData | null> {
  const firebaseConfigured = isFirebaseConfigured();
  const useFirestore = isFirestoreAvailable();
  const googlePlacesConfigured = isGooglePlacesApiConfigured();

  let place: GooglePlaceRawDocument | null;

  if (isFirestoreAvailable()) {
    try {
      place =
        (await fetchGooglePlace(placeId)) ??
        (await fetchGooglePlaceByPlaceId(placeId));
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        place =
          mockGooglePlacesStore.getPlace(placeId) ??
          mockGooglePlacesStore.getPlaceByPlaceId(placeId);
      } else {
        throw error;
      }
    }
  } else {
    place =
      mockGooglePlacesStore.getPlace(placeId) ??
      mockGooglePlacesStore.getPlaceByPlaceId(placeId);
  }

  if (!place) return null;

  const duplicates = await findPlaceDuplicates(place);

  return {
    place,
    duplicates,
    dataMode: useFirestore ? "firestore" : "mock",
    firebaseConfigured,
    googlePlacesConfigured,
  };
}

export async function getPlacesJobsPageData() {
  const data = await getPlacesSearchPageData();
  return {
    ...data,
    jobs: await loadSearchJobs(),
  };
}

export async function listAllGooglePlaces(): Promise<GooglePlaceRawDocument[]> {
  if (isFirestoreAvailable()) {
    try {
      return await fetchGooglePlaces();
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return mockGooglePlacesStore.listPlaces();
      }
      throw error;
    }
  }
  return mockGooglePlacesStore.listPlaces();
}
