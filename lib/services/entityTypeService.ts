import type { EntityType, RawExtractedMetadata } from "@/lib/types/normalization";

const ENTITY_KEYWORDS: Record<EntityType, string[]> = {
  Club: ["club", "owners club", "enthusiasts", "community", "society"],
  Member: ["member", "enthusiast", "owner"],
  Shop: ["shop", "garage", "service"],
  Detailer: ["detail", "detailing", "detailer", "wash", "ceramic"],
  "Wrap Shop": ["wrap", "vinyl wrap", "ppf", "wrap shop"],
  "Tint Shop": ["tint", "window tint", "tint shop"],
  "Wheel Shop": ["wheel", "rim", "tire", "wheel shop"],
  "Performance Shop": ["performance", "tuning", "tuner", "mod shop", "build shop"],
  "Dyno Shop": ["dyno", "dynojet", "horsepower"],
  Photographer: ["photo", "photographer", "photography"],
  Videographer: ["video", "videographer", "filmmaker"],
  "Content Creator": ["content creator", "influencer", "creator"],
  Dealer: ["dealer", "dealership", "sales"],
  Track: ["track", "circuit", "raceway", "speedway"],
  "Event Organizer": ["event organizer", "events", "organizer", "host"],
  "Car Event": ["car show", "meet", "cars and coffee", "event"],
  "Community Zone": ["community", "zone", "hub"],
  Unknown: [],
};

export function detectEntityType(raw: RawExtractedMetadata): EntityType {
  const haystack = [
    raw.displayName,
    raw.bio,
    raw.businessCategory,
    raw.username,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  let bestMatch: EntityType = "Unknown";
  let bestScore = 0;

  for (const [entityType, keywords] of Object.entries(ENTITY_KEYWORDS) as [EntityType, string[]][]) {
    if (entityType === "Unknown") continue;
    const score = keywords.filter((keyword) => haystack.includes(keyword)).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entityType;
    }
  }

  if (bestScore === 0 && haystack.includes("club")) return "Club";
  return bestMatch;
}

export function getEntityTypeLabel(entityType: EntityType): string {
  return entityType;
}
