import type { MatchConfidenceLevel } from "@/lib/types/normalization";
import type { MatchReason } from "@/lib/types/duplicates";

const FIELD_TO_REASON: Record<string, MatchReason> = {
  username: "same_instagram",
  website: "same_website",
  domain: "same_domain",
  publicEmail: "same_email",
  publicPhone: "same_phone",
  googlePlaceId: "same_google_place_id",
  displayName: "similar_name",
  location: "same_name_city",
  city: "same_name_city",
  coordinates: "nearby_coordinates",
};

export function mapFieldsToReasons(fields: string[]): MatchReason[] {
  const reasons = new Set<MatchReason>();
  for (const field of fields) {
    const reason = FIELD_TO_REASON[field];
    if (reason) reasons.add(reason);
  }
  if (reasons.size === 0 && fields.length > 0) {
    reasons.add("similar_name");
  }
  return [...reasons];
}

export function resolveConfidenceLevel(score: number): MatchConfidenceLevel {
  if (score >= 70) return "high";
  if (score >= 45) return "medium";
  if (score >= 25) return "low";
  return "possible";
}

export function getConfidenceLabel(level: MatchConfidenceLevel): string {
  const labels: Record<MatchConfidenceLevel, string> = {
    high: "High Confidence",
    medium: "Medium",
    low: "Low",
    possible: "Possible Match",
    none: "No Match",
  };
  return labels[level];
}

export function getReasonLabel(reason: MatchReason): string {
  const labels: Record<MatchReason, string> = {
    same_instagram: "Same Instagram",
    same_website: "Same Website",
    same_domain: "Same Domain",
    same_email: "Same Email",
    same_phone: "Same Phone",
    same_google_place_id: "Same Google Place",
    same_name_city: "Same Name & City",
    similar_name: "Similar Name",
    nearby_coordinates: "Nearby Coordinates",
    manual_flag: "Manual Flag",
  };
  return labels[reason];
}

export function getMatchStatusLabel(status: import("@/lib/types/duplicates").EntityMatchStatus): string {
  const labels = {
    pending: "Pending",
    resolved: "Resolved",
    ignored: "Ignored",
    needs_review: "Needs Review",
  };
  return labels[status];
}

export function getResolutionLabel(
  resolution: import("@/lib/types/duplicates").MatchResolution | null,
): string {
  if (!resolution) return "—";
  const labels = {
    merge: "Merged",
    keep_separate: "Kept Separate",
    mark_duplicate: "Marked Duplicate",
    approve_both: "Approved Both",
  };
  return labels[resolution];
}

export function isToday(isoDate: string): boolean {
  const date = new Date(isoDate);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}
