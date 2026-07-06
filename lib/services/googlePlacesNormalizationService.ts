/**
 * Production Google Places normalization service.
 * Delegates to the existing normalization pipeline — no separate entity model.
 */
export {
  googlePlaceToRaw,
  normalizeGooglePlace,
  previewNormalizedPlace,
} from "@/lib/services/placesNormalizationService";
