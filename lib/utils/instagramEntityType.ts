export const INSTAGRAM_ENTITY_TYPES = ["club", "member", "unknown"] as const;

export type InstagramEntityType = (typeof INSTAGRAM_ENTITY_TYPES)[number];

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

export function detectInstagramEntityType(input: {
  username: string;
  displayName?: string | null;
  bio?: string | null;
}): InstagramEntityType {
  const searchText = buildSearchText([input.username, input.displayName, input.bio]);

  if (!searchText) {
    return "unknown";
  }

  if (containsClubTerm(searchText)) {
    return "club";
  }

  return "member";
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
