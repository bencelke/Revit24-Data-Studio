import {
  GOOGLE_PLACES_CONFIG,
  isGooglePlacesEnabled,
} from "@/lib/config/google-places";
import type {
  CreateGooglePlaceRawInput,
  GooglePlacesApiError,
  GooglePlacesErrorCode,
  GooglePlacesSearchType,
  PlacesSearchQuery,
} from "@/lib/types/google-places";

const TEXT_SEARCH_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json";
const NEARBY_SEARCH_URL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";
const DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json";

interface GoogleApiResponse {
  status: string;
  error_message?: string;
  results?: GooglePlaceResult[];
  next_page_token?: string;
  result?: GooglePlaceDetailsResult;
}

interface GooglePlaceResult {
  place_id: string;
  name: string;
  formatted_address?: string;
  rating?: number;
  user_ratings_total?: number;
  business_status?: string;
  types?: string[];
  geometry?: { location?: { lat?: number; lng?: number } };
  photos?: Array<{ photo_reference?: string }>;
}

interface GooglePlaceDetailsResult extends GooglePlaceResult {
  formatted_phone_number?: string;
  international_phone_number?: string;
  website?: string;
  url?: string;
  opening_hours?: { weekday_text?: string[] };
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

export interface GooglePlacesSearchInput extends PlacesSearchQuery {
  jobId?: string | null;
}

export interface GooglePlacesProviderResult {
  places: CreateGooglePlaceRawInput[];
  totalResults: number;
  mockMode: boolean;
  error: GooglePlacesApiError | null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createError(
  code: GooglePlacesErrorCode,
  message: string,
  retryable = false,
): GooglePlacesApiError {
  return { code, message, retryable };
}

function mapApiStatus(status: string, message?: string): GooglePlacesApiError | null {
  switch (status) {
    case "OK":
    case "ZERO_RESULTS":
      return status === "ZERO_RESULTS"
        ? createError("NO_RESULTS", message ?? "No places found for this search.", false)
        : null;
    case "REQUEST_DENIED":
      return createError("INVALID_API_KEY", message ?? "Invalid Google Places API key.", false);
    case "OVER_QUERY_LIMIT":
      return createError("QUOTA_EXCEEDED", message ?? "Google Places API quota exceeded.", true);
    case "INVALID_REQUEST":
      return createError("UNKNOWN", message ?? "Invalid search request.", false);
    default:
      return createError("UNKNOWN", message ?? `Google Places API error: ${status}`, true);
  }
}

function resolveSearchType(query: PlacesSearchQuery): GooglePlacesSearchType {
  if (query.searchType) return query.searchType;
  if (query.latitude != null && query.longitude != null) return "nearby";
  if (query.category) return "category";
  if (query.keyword) return "keyword";
  return "text";
}

function buildTextQuery(query: PlacesSearchQuery): string {
  return [query.keyword, query.category, query.area, query.city, query.state, query.country]
    .filter(Boolean)
    .join(" ");
}

function parseAddressComponents(
  components: GooglePlaceDetailsResult["address_components"],
  fallback: PlacesSearchQuery,
): { country: string; state: string; city: string; postalCode: string | null } {
  let country = fallback.country;
  let state = fallback.state;
  let city = fallback.city;
  let postalCode: string | null = null;

  for (const component of components ?? []) {
    if (component.types.includes("country")) country = component.long_name;
    if (component.types.includes("administrative_area_level_1")) state = component.long_name;
    if (component.types.includes("locality")) city = component.long_name;
    if (component.types.includes("postal_code")) postalCode = component.long_name;
  }

  return { country, state, city, postalCode };
}

function mapPlaceToRaw(
  result: GooglePlaceResult | GooglePlaceDetailsResult,
  query: PlacesSearchQuery,
  jobId: string | null,
  details?: GooglePlaceDetailsResult | null,
): CreateGooglePlaceRawInput {
  const merged = details ? { ...result, ...details } : result;
  const addressParts = parseAddressComponents(details?.address_components, query);
  const timestamp = new Date().toISOString();
  const photoRefs = (merged.photos ?? [])
    .map((photo) => photo.photo_reference)
    .filter((ref): ref is string => Boolean(ref));

  return {
    placeId: merged.place_id,
    name: merged.name,
    businessCategory: query.category || merged.types?.[0]?.replace(/_/g, " ") || "Business",
    rating: merged.rating ?? null,
    reviewCount: merged.user_ratings_total ?? null,
    formattedAddress: merged.formatted_address ?? "",
    country: addressParts.country,
    state: addressParts.state,
    city: addressParts.city,
    area: query.area,
    postalCode: addressParts.postalCode,
    latitude: merged.geometry?.location?.lat ?? query.latitude ?? 0,
    longitude: merged.geometry?.location?.lng ?? query.longitude ?? 0,
    phone:
      details?.international_phone_number ??
      details?.formatted_phone_number ??
      null,
    website: details?.website ?? null,
    googleMapsUrl:
      details?.url ?? `https://www.google.com/maps/place/?q=place_id:${merged.place_id}`,
    openingHours: details?.opening_hours?.weekday_text ?? [],
    photos: photoRefs,
    businessStatus: merged.business_status ?? null,
    status: "discovered",
    source: "google_places",
    searchJobId: jobId,
    createdAt: timestamp,
  };
}

async function fetchGoogleApi(url: URL): Promise<GoogleApiResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GOOGLE_PLACES_CONFIG.requestTimeoutMs);

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw createError("NETWORK_FAILURE", `HTTP ${response.status}`, true);
    }

    return (await response.json()) as GoogleApiResponse;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw createError("TIMEOUT", "Google Places API request timed out.", true);
    }
    if ((error as GooglePlacesApiError).code) throw error;
    throw createError(
      "NETWORK_FAILURE",
      error instanceof Error ? error.message : "Network request failed.",
      true,
    );
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchWithRetry(url: URL): Promise<GoogleApiResponse> {
  let lastError: GooglePlacesApiError | null = null;

  for (let attempt = 0; attempt <= GOOGLE_PLACES_CONFIG.maxRetries; attempt += 1) {
    if (attempt > 0) {
      await sleep(GOOGLE_PLACES_CONFIG.retryDelayMs);
    }

    try {
      const data = await fetchGoogleApi(url);
      const apiError = mapApiStatus(data.status, data.error_message);
      if (apiError) {
        if (apiError.retryable && attempt < GOOGLE_PLACES_CONFIG.maxRetries) {
          lastError = apiError;
          continue;
        }
        throw apiError;
      }
      return data;
    } catch (error) {
      const apiError = error as GooglePlacesApiError;
      if (apiError.retryable && attempt < GOOGLE_PLACES_CONFIG.maxRetries) {
        lastError = apiError;
        continue;
      }
      throw error;
    }
  }

  throw lastError ?? createError("UNKNOWN", "Google Places API request failed.", true);
}

export class GooglePlacesProductionProvider {
  async textSearch(
    query: PlacesSearchQuery,
    jobId: string | null = null,
  ): Promise<CreateGooglePlaceRawInput[]> {
    const url = new URL(TEXT_SEARCH_URL);
    url.searchParams.set("query", buildTextQuery(query));
    url.searchParams.set("key", GOOGLE_PLACES_CONFIG.apiKey);
    if (query.language) url.searchParams.set("language", query.language);
    if (GOOGLE_PLACES_CONFIG.defaultRegion) {
      url.searchParams.set("region", GOOGLE_PLACES_CONFIG.defaultRegion);
    }

    return this.collectResults(url, query, jobId);
  }

  async nearbySearch(
    query: PlacesSearchQuery,
    jobId: string | null = null,
  ): Promise<CreateGooglePlaceRawInput[]> {
    if (query.latitude == null || query.longitude == null) {
      throw createError("UNKNOWN", "Nearby search requires latitude and longitude.", false);
    }

    const url = new URL(NEARBY_SEARCH_URL);
    url.searchParams.set("location", `${query.latitude},${query.longitude}`);
    url.searchParams.set("radius", String(query.radius || GOOGLE_PLACES_CONFIG.defaultRadiusMeters));
    url.searchParams.set("key", GOOGLE_PLACES_CONFIG.apiKey);
    if (query.keyword) url.searchParams.set("keyword", query.keyword);
    if (query.language) url.searchParams.set("language", query.language);
    if (query.category) {
      url.searchParams.set("type", query.category.toLowerCase().replace(/\s+/g, "_"));
    }

    return this.collectResults(url, query, jobId);
  }

  private async collectResults(
    initialUrl: URL,
    query: PlacesSearchQuery,
    jobId: string | null,
  ): Promise<CreateGooglePlaceRawInput[]> {
    const limit = query.resultLimit ?? GOOGLE_PLACES_CONFIG.defaultResultLimit;
    const places: CreateGooglePlaceRawInput[] = [];
    let url: URL | null = initialUrl;

    while (url && places.length < limit) {
      const data = await fetchWithRetry(url);
      const batch = data.results ?? [];

      for (const result of batch) {
        if (places.length >= limit) break;
        const details = await this.fetchPlaceDetails(result.place_id, query.language);
        places.push(mapPlaceToRaw(result, query, jobId, details));
      }

      if (data.next_page_token && places.length < limit) {
        await sleep(2000);
        url = new URL(initialUrl);
        url.searchParams.set("pagetoken", data.next_page_token);
      } else {
        url = null;
      }
    }

    return places;
  }

  async fetchPlaceDetails(
    placeId: string,
    language?: string,
  ): Promise<GooglePlaceDetailsResult | null> {
    const url = new URL(DETAILS_URL);
    url.searchParams.set("place_id", placeId);
    url.searchParams.set(
      "fields",
      "place_id,name,formatted_address,rating,user_ratings_total,business_status,types,geometry,photos,formatted_phone_number,international_phone_number,website,url,opening_hours,address_components",
    );
    url.searchParams.set("key", GOOGLE_PLACES_CONFIG.apiKey);
    if (language) url.searchParams.set("language", language);

    try {
      const data = await fetchWithRetry(url);
      return data.result ?? null;
    } catch {
      return null;
    }
  }

  async executeSearch(input: GooglePlacesSearchInput): Promise<GooglePlacesProviderResult> {
    const searchType = resolveSearchType(input);
    const jobId = input.jobId ?? null;

    try {
      let places: CreateGooglePlaceRawInput[];

      if (searchType === "nearby" && input.latitude != null && input.longitude != null) {
        places = await this.nearbySearch(input, jobId);
      } else {
        places = await this.textSearch(input, jobId);
      }

      if (places.length === 0) {
        return {
          places: [],
          totalResults: 0,
          mockMode: false,
          error: createError("NO_RESULTS", "No places found for this search.", false),
        };
      }

      return {
        places,
        totalResults: places.length,
        mockMode: false,
        error: null,
      };
    } catch (error) {
      const apiError = error as GooglePlacesApiError;
      return {
        places: [],
        totalResults: 0,
        mockMode: false,
        error: apiError.code
          ? apiError
          : createError("UNKNOWN", error instanceof Error ? error.message : "Search failed.", true),
      };
    }
  }
}

export const defaultGooglePlacesProductionProvider = new GooglePlacesProductionProvider();

export function isProductionGooglePlacesAvailable(): boolean {
  return isGooglePlacesEnabled();
}

export function getGooglePlacesPhotoMetadataUrl(photoReference: string): string {
  const url = new URL("https://maps.googleapis.com/maps/api/place/photo");
  url.searchParams.set("maxwidth", "400");
  url.searchParams.set("photoreference", photoReference);
  url.searchParams.set("key", GOOGLE_PLACES_CONFIG.apiKey);
  return url.toString();
}
