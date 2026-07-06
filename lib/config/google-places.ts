function readBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value == null || value.trim() === "") return defaultValue;
  return value === "true" || value === "1";
}

function readNumber(value: string | undefined, defaultValue: number): number {
  if (value == null || value.trim() === "") return defaultValue;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : defaultValue;
}

export const GOOGLE_PLACES_CONFIG = {
  apiKey: process.env.GOOGLE_PLACES_API_KEY ?? "",
  enabled: readBoolean(process.env.ENABLE_GOOGLE_PLACES, false),
  defaultRadiusMeters: readNumber(process.env.GOOGLE_PLACES_DEFAULT_RADIUS, 5000),
  defaultResultLimit: readNumber(process.env.GOOGLE_PLACES_DEFAULT_LIMIT, 20),
  defaultLanguage: process.env.GOOGLE_PLACES_DEFAULT_LANGUAGE ?? "en",
  defaultRegion: process.env.GOOGLE_PLACES_DEFAULT_REGION ?? "",
  requestTimeoutMs: readNumber(process.env.GOOGLE_PLACES_TIMEOUT_MS, 30000),
  maxRetries: readNumber(process.env.GOOGLE_PLACES_MAX_RETRIES, 2),
  retryDelayMs: readNumber(process.env.GOOGLE_PLACES_RETRY_DELAY_MS, 1000),
} as const;

export function isGooglePlacesApiConfigured(): boolean {
  return GOOGLE_PLACES_CONFIG.apiKey.length > 0;
}

export function isGooglePlacesEnabled(): boolean {
  return GOOGLE_PLACES_CONFIG.enabled && isGooglePlacesApiConfigured();
}

export function shouldUseGooglePlacesMock(): boolean {
  return !isGooglePlacesEnabled();
}
