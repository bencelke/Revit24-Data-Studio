import type {
  CreateGooglePlaceRawInput,
  CreatePlacesSearchJobInput,
  CreateSavedSearchInput,
  GooglePlaceRawDocument,
  PlacesSearchJobDocument,
  SavedSearchDocument,
} from "@/lib/types/google-places";

const mockPlaces = new Map<string, GooglePlaceRawDocument>();
const mockSavedSearches = new Map<string, SavedSearchDocument>();
const mockSearchJobs = new Map<string, PlacesSearchJobDocument>();

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const mockGooglePlacesStore = {
  upsertPlace(input: CreateGooglePlaceRawInput): GooglePlaceRawDocument {
    const existing = [...mockPlaces.values()].find((place) => place.placeId === input.placeId);
    if (existing) {
      const updated = { ...input, id: existing.id };
      mockPlaces.set(existing.id, updated);
      return updated;
    }
    const id = generateId("gp_raw");
    const place: GooglePlaceRawDocument = { ...input, id };
    mockPlaces.set(id, place);
    return place;
  },

  createPlaces(inputs: CreateGooglePlaceRawInput[]): GooglePlaceRawDocument[] {
    return inputs.map((input) => this.upsertPlace(input));
  },

  getPlace(id: string): GooglePlaceRawDocument | null {
    return mockPlaces.get(id) ?? null;
  },

  getPlaceByPlaceId(placeId: string): GooglePlaceRawDocument | null {
    return [...mockPlaces.values()].find((place) => place.placeId === placeId) ?? null;
  },

  listPlaces(): GooglePlaceRawDocument[] {
    return [...mockPlaces.values()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  listPlacesByJobId(jobId: string): GooglePlaceRawDocument[] {
    return this.listPlaces().filter((place) => place.searchJobId === jobId);
  },

  updatePlace(id: string, data: Partial<CreateGooglePlaceRawInput>): GooglePlaceRawDocument | null {
    const existing = mockPlaces.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, id };
    mockPlaces.set(id, updated);
    return updated;
  },

  hasPlaces(): boolean {
    return mockPlaces.size > 0;
  },
};

export const mockSavedSearchStore = {
  createSearch(input: CreateSavedSearchInput): SavedSearchDocument {
    const id = generateId("saved_search");
    const search: SavedSearchDocument = { ...input, id };
    mockSavedSearches.set(id, search);
    return search;
  },

  listSearches(): SavedSearchDocument[] {
    return [...mockSavedSearches.values()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  deleteSearch(id: string): void {
    mockSavedSearches.delete(id);
  },
};

export const mockPlacesSearchJobsStore = {
  createJob(input: CreatePlacesSearchJobInput): PlacesSearchJobDocument {
    const id = generateId("places_job");
    const job: PlacesSearchJobDocument = {
      ...input,
      id,
      completedAt: input.completedAt ?? null,
      totalResults: input.totalResults ?? 0,
      importedResults: input.importedResults ?? 0,
      failedResults: input.failedResults ?? 0,
      scheduledAt: input.scheduledAt ?? null,
      clonedFromJobId: input.clonedFromJobId ?? null,
      searchType: input.searchType ?? null,
      errorMessage: input.errorMessage ?? null,
    };
    mockSearchJobs.set(id, job);
    return job;
  },

  getJob(id: string): PlacesSearchJobDocument | null {
    return mockSearchJobs.get(id) ?? null;
  },

  listJobs(): PlacesSearchJobDocument[] {
    return [...mockSearchJobs.values()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  updateJob(id: string, data: Partial<PlacesSearchJobDocument>): PlacesSearchJobDocument | null {
    const existing = mockSearchJobs.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, id };
    mockSearchJobs.set(id, updated);
    return updated;
  },
};
