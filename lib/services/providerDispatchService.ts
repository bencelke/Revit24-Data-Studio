import type {
  CreateDiscoveryResultInput,
  DiscoveryCampaignDocument,
  DiscoveryConfidenceLevel,
  DiscoveryEntityType,
  DiscoveryProvider,
} from "@/lib/types/discovery-engine";
import { generateCampaignKeywords } from "@/lib/services/keywordGenerationService";

export interface DiscoveryProviderDispatchInput {
  campaign: DiscoveryCampaignDocument;
  jobId: string;
  keywords: string[];
}

export interface DiscoveryProviderAdapter {
  readonly provider: DiscoveryProvider;
  readonly label: string;
  readonly isActive: boolean;
  discover(input: DiscoveryProviderDispatchInput): Promise<CreateDiscoveryResultInput[]>;
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40);
}

function buildResult(
  input: DiscoveryProviderDispatchInput,
  index: number,
  keyword: string,
  entityType: DiscoveryEntityType,
  url: string,
  confidence: DiscoveryConfidenceLevel,
  isDuplicate: boolean,
): CreateDiscoveryResultInput {
  const location = input.campaign.city ?? input.campaign.country ?? null;
  return {
    jobId: input.jobId,
    campaignId: input.campaign.id,
    source: input.campaign.provider,
    name: `${keyword}${location ? ` — ${location}` : ""}`,
    url,
    entityType,
    country: input.campaign.country,
    city: input.campaign.city,
    status: isDuplicate ? "duplicate" : "new",
    confidence,
    isDuplicate,
    isQueued: !isDuplicate,
    importRecordId: null,
    createdAt: new Date().toISOString(),
    metadata: { keyword, dispatched: true },
  };
}

class InstagramDiscoveryAdapter implements DiscoveryProviderAdapter {
  readonly provider = "instagram" as const;
  readonly label = "Instagram";
  readonly isActive = true;

  async discover(input: DiscoveryProviderDispatchInput): Promise<CreateDiscoveryResultInput[]> {
    const entityType = input.campaign.entityTypes[0] ?? "club";
    return input.keywords.slice(0, 8).map((keyword, index) => {
      const slug = slugify(`${keyword}_${input.campaign.city ?? input.campaign.country ?? "eu"}_${index}`);
      return buildResult(
        input,
        index,
        keyword,
        entityType,
        `https://www.instagram.com/${slug}/`,
        index < 3 ? "high" : index < 6 ? "medium" : "low",
        index === 7,
      );
    });
  }
}

class GooglePlacesDiscoveryAdapter implements DiscoveryProviderAdapter {
  readonly provider = "google_places" as const;
  readonly label = "Google Places";
  readonly isActive = true;

  async discover(input: DiscoveryProviderDispatchInput): Promise<CreateDiscoveryResultInput[]> {
    const entityType = input.campaign.entityTypes[0] ?? "business";
    return input.keywords.slice(0, 8).map((keyword, index) =>
      buildResult(
        input,
        index,
        keyword,
        entityType,
        `https://maps.google.com/?q=${encodeURIComponent(keyword + " " + (input.campaign.city ?? input.campaign.country ?? ""))}`,
        index < 4 ? "high" : "medium",
        index === 7,
      ),
    );
  }
}

class WebsiteDiscoveryAdapter implements DiscoveryProviderAdapter {
  readonly provider = "website" as const;
  readonly label = "Website";
  readonly isActive = true;

  async discover(input: DiscoveryProviderDispatchInput): Promise<CreateDiscoveryResultInput[]> {
    const entityType = input.campaign.entityTypes[0] ?? "business";
    return input.keywords.slice(0, 6).map((keyword, index) => {
      const slug = slugify(keyword);
      return buildResult(
        input,
        index,
        keyword,
        entityType,
        `https://${slug}.com`,
        "medium",
        false,
      );
    });
  }
}

class CsvDiscoveryAdapter implements DiscoveryProviderAdapter {
  readonly provider = "csv" as const;
  readonly label = "CSV Import";
  readonly isActive = true;

  async discover(input: DiscoveryProviderDispatchInput): Promise<CreateDiscoveryResultInput[]> {
    return input.keywords.slice(0, 3).map((keyword, index) =>
      buildResult(
        input,
        index,
        keyword,
        "unknown",
        `csv://campaign/${input.campaign.id}/${slugify(keyword)}`,
        "low",
        false,
      ),
    );
  }
}

class ManualDiscoveryAdapter implements DiscoveryProviderAdapter {
  readonly provider = "manual" as const;
  readonly label = "Manual";
  readonly isActive = true;

  async discover(input: DiscoveryProviderDispatchInput): Promise<CreateDiscoveryResultInput[]> {
    return input.keywords.slice(0, 2).map((keyword, index) =>
      buildResult(
        input,
        index,
        keyword,
        input.campaign.entityTypes[0] ?? "unknown",
        `manual://entry/${slugify(keyword)}`,
        "low",
        false,
      ),
    );
  }
}

class FutureDiscoveryAdapter implements DiscoveryProviderAdapter {
  constructor(
    readonly provider: DiscoveryProvider,
    readonly label: string,
  ) {
    this.isActive = false;
  }

  readonly isActive: boolean;

  async discover(): Promise<CreateDiscoveryResultInput[]> {
    return [];
  }
}

const ADAPTERS: DiscoveryProviderAdapter[] = [
  new InstagramDiscoveryAdapter(),
  new GooglePlacesDiscoveryAdapter(),
  new WebsiteDiscoveryAdapter(),
  new CsvDiscoveryAdapter(),
  new ManualDiscoveryAdapter(),
  new FutureDiscoveryAdapter("facebook", "Facebook"),
  new FutureDiscoveryAdapter("tiktok", "TikTok"),
  new FutureDiscoveryAdapter("youtube", "YouTube"),
  new FutureDiscoveryAdapter("discord", "Discord"),
  new FutureDiscoveryAdapter("reddit", "Reddit"),
];

const adapterMap = new Map(ADAPTERS.map((adapter) => [adapter.provider, adapter]));

export function getDiscoveryProviderAdapter(
  provider: DiscoveryProvider,
): DiscoveryProviderAdapter | null {
  return adapterMap.get(provider) ?? null;
}

export function listDiscoveryProviderAdapters(): DiscoveryProviderAdapter[] {
  return ADAPTERS;
}

export async function dispatchDiscoveryProvider(
  campaign: DiscoveryCampaignDocument,
  jobId: string,
): Promise<CreateDiscoveryResultInput[]> {
  const adapter = getDiscoveryProviderAdapter(campaign.provider);
  if (!adapter) {
    throw new Error(`No discovery adapter registered for provider: ${campaign.provider}`);
  }

  if (!adapter.isActive) {
    throw new Error(`Provider ${adapter.label} is not yet available.`);
  }

  const keywords = generateCampaignKeywords(campaign);
  return adapter.discover({ campaign, jobId, keywords });
}

export function mapDiscoveryProviderToPipelineProvider(
  provider: DiscoveryProvider,
): import("@/lib/types/pipeline").PipelineProvider {
  switch (provider) {
    case "instagram":
      return "instagram";
    case "google_places":
      return "google_places";
    case "website":
      return "website";
    case "csv":
      return "csv";
    default:
      return "manual";
  }
}
