import type { InstagramEntityType } from "@/lib/types/instagramExtraction";

const CLUB_TERMS = [
  "club",
  "crew",
  "community",
  "team",
  "gruppe",
  "owners",
  "drivers",
  "society",
  "cars",
  "meet",
  "meets",
  "official",
  "chapter",
] as const;

export interface InstagramEntityTypeRecord {
  username: string;
  displayName?: string | null;
  bio?: string | null;
  status?: string | null;
}

function buildSearchText(parts: Array<string | null | undefined>): string {
  return parts
    .filter((value): value is string => Boolean(value && value.trim().length > 0))
    .join(" ")
    .toLowerCase();
}

function containsClubTerm(text: string): boolean {
  return CLUB_TERMS.some((term) => {
    const pattern = new RegExp(`(^|[^a-z0-9])${term}([^a-z0-9]|$)`);
    return pattern.test(text) || text.includes(term);
  });
}

function isSuccessfulStatus(status: string | null | undefined): boolean {
  return status === "success" || status === "completed" || status === "mock";
}

function isFailedStatus(status: string | null | undefined): boolean {
  return status === "failed";
}

export function detectInstagramEntityType(record: InstagramEntityTypeRecord): InstagramEntityType {
  if (isFailedStatus(record.status)) {
    return "unknown";
  }

  const searchText = buildSearchText([record.username, record.displayName, record.bio]);

  if (!searchText) {
    return "unknown";
  }

  if (containsClubTerm(searchText)) {
    return "club";
  }

  if (isSuccessfulStatus(record.status)) {
    return "member";
  }

  return "unknown";
}

export function formatInstagramEntityType(entityType: InstagramEntityType): string {
  switch (entityType) {
    case "club":
      return "Club";
    case "member":
      return "Member";
    default:
      return "Unknown";
  }
}

export function isSuccessfulExtractionStatus(status: string): boolean {
  return isSuccessfulStatus(status);
}
