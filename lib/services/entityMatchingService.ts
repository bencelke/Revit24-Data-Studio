import type { NormalizedRecordDocument } from "@/lib/types/normalization";
import type { EntityMatchDocument, MatchReason } from "@/lib/types/duplicates";
import type { MatchConfidenceLevel } from "@/lib/types/normalization";
import {
  mapFieldsToReasons,
  resolveConfidenceLevel,
} from "@/lib/services/matchScoringService";

export interface MatchCandidate {
  record: NormalizedRecordDocument;
  matchFields: string[];
  reasons: MatchReason[];
  confidenceScore: number;
  confidenceLevel: MatchConfidenceLevel;
}

function normalizeForCompare(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function scoreFieldMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = normalizeForCompare(a);
  const right = normalizeForCompare(b);
  return Boolean(left && right && left === right);
}

function scorePartialName(a: string, b: string): boolean {
  const left = normalizeForCompare(a);
  const right = normalizeForCompare(b);
  if (!left || !right) return false;
  return left.includes(right) || right.includes(left);
}

export function compareRecords(
  source: NormalizedRecordDocument,
  candidate: NormalizedRecordDocument,
): MatchCandidate | null {
  if (source.id === candidate.id) return null;

  const matchFields: string[] = [];
  let score = 0;

  if (scoreFieldMatch(source.username, candidate.username)) {
    matchFields.push("username");
    score += 40;
  }
  if (scoreFieldMatch(source.website, candidate.website)) {
    matchFields.push("website");
    score += 30;
  }
  if (scoreFieldMatch(source.publicEmail, candidate.publicEmail)) {
    matchFields.push("publicEmail");
    score += 25;
  }
  if (scoreFieldMatch(source.publicPhone, candidate.publicPhone)) {
    matchFields.push("publicPhone");
    score += 25;
  }
  if (scorePartialName(source.displayName, candidate.displayName)) {
    matchFields.push("displayName");
    score += 15;
  }
  if (
    scoreFieldMatch(source.city, candidate.city) &&
    scoreFieldMatch(source.country, candidate.country)
  ) {
    matchFields.push("location");
    score += 10;
  }

  if (
    source.latitude != null &&
    source.longitude != null &&
    candidate.latitude != null &&
    candidate.longitude != null
  ) {
    const latDiff = Math.abs(source.latitude - candidate.latitude);
    const lngDiff = Math.abs(source.longitude - candidate.longitude);
    if (latDiff < 0.0005 && lngDiff < 0.0005) {
      matchFields.push("coordinates");
      score += 20;
    }
  }

  if (matchFields.length === 0) return null;

  const confidenceLevel = resolveConfidenceLevel(score);
  return {
    record: candidate,
    matchFields,
    reasons: mapFieldsToReasons(matchFields),
    confidenceScore: Math.min(100, score),
    confidenceLevel,
  };
}

export function findPotentialMatches(
  source: NormalizedRecordDocument,
  candidates: NormalizedRecordDocument[],
): MatchCandidate[] {
  return candidates
    .map((candidate) => compareRecords(source, candidate))
    .filter((match): match is MatchCandidate => match !== null)
    .sort((a, b) => b.confidenceScore - a.confidenceScore);
}

export function toEntityMatchDocument(
  sourceId: string,
  match: MatchCandidate,
  timestamp: string,
): Omit<EntityMatchDocument, "id"> {
  return {
    recordAId: sourceId,
    recordBId: match.record.id,
    matchType: "automatic",
    confidence: match.confidenceLevel,
    confidenceScore: match.confidenceScore,
    status: "pending",
    reasons: match.reasons,
    createdAt: timestamp,
    updatedAt: timestamp,
    resolvedBy: null,
    resolvedAt: null,
    resolution: null,
    notes: null,
    matchedDisplayName: match.record.displayName,
  };
}

export function getMatchLevelLabel(level: MatchConfidenceLevel): string {
  const labels: Record<MatchConfidenceLevel, string> = {
    high: "High Confidence",
    medium: "Medium",
    low: "Low",
    possible: "Possible Match",
    none: "No Match",
  };
  return labels[level];
}
