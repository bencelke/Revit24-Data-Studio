export const GOOGLE_PLACES_BUSINESS_CATEGORIES = [
  "Performance Shop",
  "Tuning Shop",
  "Dyno Shop",
  "Wrap Shop",
  "Tint Shop",
  "Detailing Shop",
  "Wheel Shop",
  "Tire Shop",
  "Alignment Shop",
  "Suspension Shop",
  "Body Shop",
  "Paint Shop",
  "Exhaust Shop",
  "Fabrication Shop",
  "Dealership",
  "Car Wash",
  "Ceramic Coating",
  "PPF Installer",
  "Motorsport Shop",
  "Race Track",
  "Parts Store",
  "Photography Studio",
] as const;

export type GooglePlacesBusinessCategory = (typeof GOOGLE_PLACES_BUSINESS_CATEGORIES)[number];

export const PLACES_SEARCH_JOB_STATUSES = [
  "pending",
  "running",
  "completed",
  "failed",
  "cancelled",
] as const;

export type PlacesSearchJobStatus = (typeof PLACES_SEARCH_JOB_STATUSES)[number];

export const GOOGLE_PLACE_STATUSES = [
  "discovered",
  "imported",
  "queued",
  "rejected",
  "duplicate",
  "pending_review",
  "approved",
] as const;

export type GooglePlaceStatus = (typeof GOOGLE_PLACE_STATUSES)[number];

export interface PlacesSearchQuery {
  country: string;
  state: string;
  city: string;
  area: string;
  keyword: string;
  category: GooglePlacesBusinessCategory | "";
  radius: number;
  language?: string;
  resultLimit?: number;
}

export interface SavedSearchDocument {
  id: string;
  name: string;
  country: string;
  state: string;
  city: string;
  area: string;
  keyword: string;
  category: string;
  radius: number;
  createdBy: string;
  createdAt: string;
}

export type CreateSavedSearchInput = Omit<SavedSearchDocument, "id">;

export interface PlacesSearchJobDocument {
  id: string;
  status: PlacesSearchJobStatus;
  query: PlacesSearchQuery;
  createdBy: string;
  createdAt: string;
  completedAt: string | null;
  totalResults: number;
  importedResults: number;
  failedResults: number;
}

export type CreatePlacesSearchJobInput = Omit<
  PlacesSearchJobDocument,
  "id" | "completedAt" | "totalResults" | "importedResults" | "failedResults"
> & {
  completedAt?: string | null;
  totalResults?: number;
  importedResults?: number;
  failedResults?: number;
};

export interface GooglePlaceRawDocument {
  id: string;
  placeId: string;
  name: string;
  businessCategory: string;
  rating: number | null;
  reviewCount: number | null;
  formattedAddress: string;
  country: string;
  state: string;
  city: string;
  area: string;
  postalCode: string | null;
  latitude: number;
  longitude: number;
  phone: string | null;
  website: string | null;
  googleMapsUrl: string;
  openingHours: string[];
  photos: string[];
  status: GooglePlaceStatus;
  source: "google_places";
  searchJobId: string | null;
  createdAt: string;
}

export type CreateGooglePlaceRawInput = Omit<GooglePlaceRawDocument, "id">;

export interface PlacesDuplicateMatch {
  placeId: string;
  matchedName: string;
  matchFields: string[];
  confidenceScore: number;
  confidenceLevel: "high" | "medium" | "low" | "possible";
  matchedRecordId?: string;
  matchedSource?: "google_places_raw" | "normalized_records";
}

export interface PlacesSearchPageData {
  savedSearches: SavedSearchDocument[];
  recentJobs: PlacesSearchJobDocument[];
  dataMode: "firestore" | "mock";
  firebaseConfigured: boolean;
  googlePlacesConfigured: boolean;
  warning?: string;
}

export interface PlacesResultsPageData {
  job: PlacesSearchJobDocument;
  places: GooglePlaceRawDocument[];
  dataMode: "firestore" | "mock";
  firebaseConfigured: boolean;
  googlePlacesConfigured: boolean;
}

export interface PlaceDetailPageData {
  place: GooglePlaceRawDocument;
  duplicates: PlacesDuplicateMatch[];
  dataMode: "firestore" | "mock";
  firebaseConfigured: boolean;
  googlePlacesConfigured: boolean;
}

export interface PlacesImportResult {
  imported: number;
  queued: number;
  rejected: number;
  duplicates: number;
  failed: number;
}
