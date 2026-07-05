import type { EntityType, RawExtractedMetadata } from "@/lib/types/normalization";

export interface ConfidenceFactors {
  hasDisplayName: boolean;
  hasUsername: boolean;
  hasBio: boolean;
  hasWebsite: boolean;
  hasEmail: boolean;
  hasPhone: boolean;
  hasLocation: boolean;
  hasBrands: boolean;
  hasTags: boolean;
  entityTypeKnown: boolean;
  verified: boolean;
}

export function buildConfidenceFactors(
  raw: RawExtractedMetadata,
  normalized: {
    displayName: string;
    username: string | null;
    website: string | null;
    publicEmail: string | null;
    publicPhone: string | null;
    country: string | null;
    city: string | null;
  },
  entityType: EntityType,
  brands: string[],
  tags: string[],
): ConfidenceFactors {
  return {
    hasDisplayName: normalized.displayName !== "Unknown Entity",
    hasUsername: Boolean(normalized.username),
    hasBio: Boolean(raw.bio?.trim()),
    hasWebsite: Boolean(normalized.website),
    hasEmail: Boolean(normalized.publicEmail),
    hasPhone: Boolean(normalized.publicPhone),
    hasLocation: Boolean(normalized.country || normalized.city),
    hasBrands: brands.length > 0,
    hasTags: tags.length > 0,
    entityTypeKnown: entityType !== "Unknown",
    verified: raw.verified,
  };
}

export function calculateConfidenceScore(factors: ConfidenceFactors): number {
  let score = 25;

  if (factors.hasDisplayName) score += 10;
  if (factors.hasUsername) score += 10;
  if (factors.hasBio) score += 10;
  if (factors.hasWebsite) score += 8;
  if (factors.hasEmail) score += 7;
  if (factors.hasPhone) score += 5;
  if (factors.hasLocation) score += 8;
  if (factors.hasBrands) score += 7;
  if (factors.hasTags) score += 5;
  if (factors.entityTypeKnown) score += 10;
  if (factors.verified) score += 5;

  return Math.min(95, Math.max(25, score));
}

export function getConfidenceLabel(score: number): string {
  if (score >= 85) return "High";
  if (score >= 60) return "Medium";
  if (score >= 40) return "Low";
  return "Very Low";
}

export function getConfidenceVariant(score: number): "high" | "medium" | "low" | "very-low" {
  if (score >= 85) return "high";
  if (score >= 60) return "medium";
  if (score >= 40) return "low";
  return "very-low";
}
