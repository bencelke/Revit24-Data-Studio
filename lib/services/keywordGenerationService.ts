import type { DiscoveryCampaignDocument, KeywordBuilderInput } from "@/lib/types/discovery-engine";

function cleanPart(value: string | null | undefined): string | null {
  if (!value || !value.trim()) return null;
  return value.trim();
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

export function buildKeywordFromParts(input: KeywordBuilderInput): string[] {
  const parts = [
    cleanPart(input.brand),
    cleanPart(input.vehicleType),
    cleanPart(input.keyword),
    cleanPart(input.businessCategory),
    cleanPart(input.city),
    cleanPart(input.area),
    cleanPart(input.country),
  ].filter((part): part is string => part != null);

  if (parts.length === 0) return [];

  const combined = parts.join(" ");
  const variants: string[] = [combined];

  if (input.brand && input.city) {
    variants.push(`${input.brand} ${input.city}`);
  }
  if (input.keyword && input.city) {
    variants.push(`${input.keyword} ${input.city}`);
  }
  if (input.brand && input.country) {
    variants.push(`${input.brand} club ${input.country}`);
  }
  if (input.businessCategory && input.city) {
    variants.push(`${input.businessCategory} ${input.city}`);
  }

  return unique(variants);
}

export function buildHashtagsFromInput(input: KeywordBuilderInput): string[] {
  const tags: string[] = [];

  if (input.hashtag) {
    const tag = input.hashtag.startsWith("#") ? input.hashtag : `#${input.hashtag}`;
    tags.push(tag.toLowerCase());
  }

  if (input.brand) {
    tags.push(`#${input.brand.toLowerCase().replace(/\s+/g, "")}`);
  }
  if (input.keyword) {
    const slug = input.keyword.toLowerCase().replace(/\s+/g, "");
    tags.push(`#${slug}`);
  }

  return unique(tags);
}

export function generateCampaignKeywords(campaign: DiscoveryCampaignDocument): string[] {
  const fromFields = unique([
    ...campaign.keywords,
    ...campaign.brands.flatMap((brand) =>
      buildKeywordFromParts({
        brand,
        city: campaign.city,
        country: campaign.country,
        area: campaign.area,
      }),
    ),
    ...campaign.entityTypes.map((type) => {
      const label = type.replace(/_/g, " ");
      return campaign.city ? `${label} ${campaign.city}` : label;
    }),
  ]);

  if (fromFields.length > 0) return fromFields;

  return buildKeywordFromParts({
    country: campaign.country,
    city: campaign.city,
    area: campaign.area,
  });
}

export function generateCampaignHashtags(campaign: DiscoveryCampaignDocument): string[] {
  return unique([
    ...campaign.hashtags,
    ...campaign.brands.map((brand) => `#${brand.toLowerCase().replace(/\s+/g, "")}`),
  ]);
}

export function formatEntityType(type: string): string {
  return type
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatDiscoveryProvider(provider: string): string {
  switch (provider) {
    case "instagram":
      return "Instagram";
    case "google_places":
      return "Google Places";
    case "website":
      return "Website";
    case "csv":
      return "CSV";
    case "manual":
      return "Manual";
    case "facebook":
      return "Facebook";
    case "tiktok":
      return "TikTok";
    case "youtube":
      return "YouTube";
    case "discord":
      return "Discord";
    case "reddit":
      return "Reddit";
    default:
      return provider;
  }
}

export function isProviderActive(provider: string): boolean {
  return ["instagram", "google_places", "website", "csv", "manual"].includes(provider);
}
