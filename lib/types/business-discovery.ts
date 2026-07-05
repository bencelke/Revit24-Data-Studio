import type { GooglePlaceRawDocument, PlacesSearchQuery } from "./google-places";

export interface BusinessDiscoverySearchInput extends PlacesSearchQuery {
  resultLimit?: number;
  language?: string;
}

export interface BusinessDiscoverySearchResult {
  places: GooglePlaceRawDocument[];
  totalResults: number;
  provider: string;
  mockMode: boolean;
}

export interface BusinessDiscoveryProvider {
  readonly name: string;
  readonly platform: "google_places" | "openstreetmap" | "apple_maps" | "tomtom" | "custom";
  isConfigured(): boolean;
  search(input: BusinessDiscoverySearchInput): Promise<BusinessDiscoverySearchResult>;
}
