import type {
  BusinessDiscoveryProvider,
  BusinessDiscoverySearchInput,
  BusinessDiscoverySearchResult,
} from "@/lib/types/business-discovery";
import type { CreateGooglePlaceRawInput, PlacesSearchQuery } from "@/lib/types/google-places";
import { isGooglePlacesApiConfigured, isGooglePlacesEnabled } from "@/lib/config/google-places";
import { defaultGooglePlacesProductionProvider } from "@/lib/services/googlePlacesProvider";

const MOCK_BUSINESSES = [
  { name: "Precision Performance Tuning", category: "Performance Shop", keyword: "tuning" },
  { name: "Euro Dyno Center", category: "Dyno Shop", keyword: "dyno" },
  { name: "Midnight Wrap Studio", category: "Wrap Shop", keyword: "wrap" },
  { name: "Ceramic Pro Detailing", category: "Ceramic Coating", keyword: "ceramic" },
  { name: "Stance & Alignment Pro", category: "Alignment Shop", keyword: "alignment" },
  { name: "Trackside Motorsport", category: "Motorsport Shop", keyword: "motorsport" },
  { name: "Carbon Exhaust Works", category: "Exhaust Shop", keyword: "exhaust" },
  { name: "Elite Wheel Boutique", category: "Wheel Shop", keyword: "wheel" },
  { name: "PPF Shield Installers", category: "PPF Installer", keyword: "ppf" },
  { name: "Velocity Photography Studio", category: "Photography Studio", keyword: "photo" },
  { name: "German Auto Specialists", category: "Tuning Shop", keyword: "german" },
  { name: "Drift Fabrication Lab", category: "Fabrication Shop", keyword: "fabrication" },
];

function buildMockPlace(
  template: (typeof MOCK_BUSINESSES)[number],
  query: PlacesSearchQuery,
  index: number,
  jobId: string | null,
): CreateGooglePlaceRawInput {
  const timestamp = new Date().toISOString();
  const city = query.city || "Stuttgart";
  const country = query.country || "Germany";
  const state = query.state || "Baden-Württemberg";
  const area = query.area || "City Center";
  const slug = template.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const placeId = `mock_gp_${slug}_${index}`;

  return {
    placeId,
    name: template.name,
    businessCategory: query.category || template.category,
    rating: 4 + (index % 10) / 10,
    reviewCount: 45 + index * 17,
    formattedAddress: `${area}, ${city}, ${state}, ${country}`,
    country,
    state,
    city,
    area,
    postalCode: `${70000 + index * 11}`,
    latitude: 48.7758 + index * 0.008,
    longitude: 9.1829 + index * 0.006,
    phone: `+49 711 ${1000 + index * 111}`,
    website: `https://${slug}.example.com`,
    googleMapsUrl: `https://maps.google.com/?cid=${placeId}`,
    openingHours: ["Mon-Fri 9:00-18:00", "Sat 10:00-14:00"],
    photos: [],
    businessStatus: "OPERATIONAL",
    status: "discovered",
    source: "google_places",
    searchJobId: jobId,
    createdAt: timestamp,
  };
}

function filterMockBusinesses(input: BusinessDiscoverySearchInput): typeof MOCK_BUSINESSES {
  const keyword = input.keyword.trim().toLowerCase();
  const category = input.category.trim().toLowerCase();

  return MOCK_BUSINESSES.filter((business) => {
    if (category && !business.category.toLowerCase().includes(category)) return false;
    if (!keyword) return true;
    return (
      business.name.toLowerCase().includes(keyword) ||
      business.category.toLowerCase().includes(keyword) ||
      business.keyword.includes(keyword)
    );
  });
}

export class GooglePlacesDiscoveryProvider implements BusinessDiscoveryProvider {
  readonly name = "Google Places";
  readonly platform = "google_places" as const;

  isConfigured(): boolean {
    return isGooglePlacesApiConfigured();
  }

  async search(input: BusinessDiscoverySearchInput): Promise<BusinessDiscoverySearchResult> {
    if (isGooglePlacesEnabled()) {
      return this.searchProduction(input);
    }
    if (this.isConfigured()) {
      return this.searchLive(input);
    }
    return this.searchMock(input);
  }

  private async searchProduction(
    input: BusinessDiscoverySearchInput,
  ): Promise<BusinessDiscoverySearchResult> {
    const result = await defaultGooglePlacesProductionProvider.executeSearch(input);

    if (result.error && result.places.length === 0 && result.error.code !== "NO_RESULTS") {
      return this.searchMock(input);
    }

    return {
      places: result.places.map((place) => ({ ...place, id: `live_${place.placeId}` })),
      totalResults: result.totalResults,
      provider: this.name,
      mockMode: false,
    };
  }

  private async searchMock(input: BusinessDiscoverySearchInput): Promise<BusinessDiscoverySearchResult> {
    const limit = input.resultLimit ?? 20;
    const filtered = filterMockBusinesses(input);
    const places = filtered.slice(0, limit).map((template, index) => {
      const raw = buildMockPlace(template, input, index, null);
      return { ...raw, id: `temp_${raw.placeId}` };
    });

    return {
      places,
      totalResults: places.length,
      provider: this.name,
      mockMode: true,
    };
  }

  private async searchLive(
    input: BusinessDiscoverySearchInput,
  ): Promise<BusinessDiscoverySearchResult> {
    // Real Google Places API integration point — Text Search / Nearby Search
    // Falls back to mock when API response fails
    try {
      const queryText = [
        input.keyword,
        input.category,
        input.area,
        input.city,
        input.state,
        input.country,
      ]
        .filter(Boolean)
        .join(" ");

      const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
      url.searchParams.set("query", queryText);
      url.searchParams.set("key", process.env.GOOGLE_PLACES_API_KEY ?? "");

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error("Google Places API request failed");

      const data = (await response.json()) as {
        results?: Array<{
          place_id: string;
          name: string;
          formatted_address?: string;
          rating?: number;
          user_ratings_total?: number;
          geometry?: { location?: { lat?: number; lng?: number } };
          types?: string[];
        }>;
      };

      const timestamp = new Date().toISOString();
      const places = (data.results ?? []).slice(0, input.resultLimit ?? 20).map((result) => ({
        id: `live_${result.place_id}`,
        placeId: result.place_id,
        name: result.name,
        businessCategory: input.category || result.types?.[0] || "Shop",
        rating: result.rating ?? null,
        reviewCount: result.user_ratings_total ?? null,
        formattedAddress: result.formatted_address ?? "",
        country: input.country,
        state: input.state,
        city: input.city,
        area: input.area,
        postalCode: null,
        latitude: result.geometry?.location?.lat ?? 0,
        longitude: result.geometry?.location?.lng ?? 0,
        phone: null,
        website: null,
        googleMapsUrl: `https://maps.google.com/?q=place_id:${result.place_id}`,
        openingHours: [],
        photos: [],
        businessStatus: "OPERATIONAL",
        status: "discovered" as const,
        source: "google_places" as const,
        searchJobId: null,
        createdAt: timestamp,
      }));

      return {
        places,
        totalResults: places.length,
        provider: this.name,
        mockMode: false,
      };
    } catch {
      return this.searchMock(input);
    }
  }
}

export const defaultGooglePlacesProvider = new GooglePlacesDiscoveryProvider();

const providers = new Map<string, BusinessDiscoveryProvider>([
  ["google_places", defaultGooglePlacesProvider],
]);

export function getBusinessDiscoveryProvider(
  platform = "google_places",
): BusinessDiscoveryProvider {
  return providers.get(platform) ?? defaultGooglePlacesProvider;
}

export function registerBusinessDiscoveryProvider(
  platform: string,
  provider: BusinessDiscoveryProvider,
): void {
  providers.set(platform, provider);
}

export { buildMockPlace, filterMockBusinesses };
