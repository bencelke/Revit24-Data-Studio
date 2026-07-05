import { mockNormalizationStore } from "@/lib/mock-data/normalizationStore";
import type { RawExtractedMetadata } from "@/lib/types/normalization";

export function normalizeDisplayName(value: string | null | undefined): string {
  if (!value?.trim()) return "Unknown Entity";
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeUsername(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  return value.trim().replace(/^@/, "").toLowerCase();
}

export function normalizeWebsite(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  let url = value.trim();
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  try {
    const parsed = new URL(url);
    return parsed.href.replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function normalizeEmail(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const email = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export function normalizePhone(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const digits = value.replace(/\D/g, "");
  if (digits.length < 7) return null;
  if (digits.length <= 10) return `+1${digits}`;
  return `+${digits}`;
}

export function buildSocialLinks(raw: RawExtractedMetadata): import("@/lib/types/normalization").SocialLinks {
  const links: import("@/lib/types/normalization").SocialLinks = {};

  if (raw.username) {
    links.instagram = `https://www.instagram.com/${normalizeUsername(raw.username)}/`;
  }
  if (raw.profileUrl && raw.source === "instagram") {
    links.instagram = raw.profileUrl;
  }
  if (raw.website) {
    links.website = normalizeWebsite(raw.website);
  }

  return links;
}

export function normalizeRawMetadata(raw: RawExtractedMetadata) {
  return {
    displayName: normalizeDisplayName(raw.displayName ?? raw.username),
    username: normalizeUsername(raw.username),
    website: normalizeWebsite(raw.website),
    publicEmail: normalizeEmail(raw.publicEmail),
    publicPhone: normalizePhone(raw.publicPhone),
    description: raw.bio?.trim() || null,
    socialLinks: buildSocialLinks(raw),
  };
}

export function getNormalizationStoreStats() {
  const records = mockNormalizationStore.listRecords();
  return {
    totalNormalized: records.length,
    pendingReview: records.filter((r) => r.status === "pending_review").length,
    approved: records.filter((r) => r.status === "approved").length,
    highConfidenceMatches: mockNormalizationStore
      .listRecords()
      .flatMap((r) => mockNormalizationStore.listMatchesForRecord(r.id))
      .filter((m) => m.confidenceLevel === "high").length,
  };
}
