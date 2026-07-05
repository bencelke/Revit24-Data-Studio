export const GOOGLE_PLACES_CONFIG = {
  apiKey: process.env.GOOGLE_PLACES_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ?? "",
  defaultRadiusMeters: Number(process.env.GOOGLE_PLACES_DEFAULT_RADIUS ?? 5000),
  defaultResultLimit: Number(process.env.GOOGLE_PLACES_DEFAULT_LIMIT ?? 20),
  defaultLanguage: process.env.GOOGLE_PLACES_DEFAULT_LANGUAGE ?? "en",
} as const;

export function isGooglePlacesApiConfigured(): boolean {
  return GOOGLE_PLACES_CONFIG.apiKey.length > 0;
}
