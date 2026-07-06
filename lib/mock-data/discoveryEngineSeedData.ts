import { mockDiscoveryStore } from "@/lib/mock-data/discoveryEngineStore";
import type {
  CreateDiscoveryCampaignInput,
  CreateDiscoveryJobInput,
  CreateDiscoveryResultInput,
  CreateDiscoveryTemplateInput,
  DiscoveryEntityType,
  DiscoveryProvider,
} from "@/lib/types/discovery-engine";

const HOURS = 60 * 60 * 1000;
const now = Date.now();
const CREATED_BY = "system-dev";

const BUILTIN_TEMPLATES: Omit<CreateDiscoveryTemplateInput, "createdAt" | "updatedAt">[] = [
  {
    name: "BMW Clubs",
    description: "Discover BMW enthusiast clubs and communities",
    provider: "instagram",
    entityTypes: ["club", "community"],
    keywords: ["BMW club", "BMW owners", "Bimmer meet"],
    hashtags: ["#bmwclub", "#bimmer", "#bmwlife"],
    brands: ["BMW"],
    vehicleTypes: ["sedan", "coupe", "suv"],
    languages: ["de", "en"],
    category: "clubs",
    isBuiltIn: true,
  },
  {
    name: "Mercedes Clubs",
    description: "Discover Mercedes-Benz clubs and communities",
    provider: "instagram",
    entityTypes: ["club", "community"],
    keywords: ["Mercedes club", "AMG owners", "Benz meet"],
    hashtags: ["#mercedesclub", "#amg", "#benz"],
    brands: ["Mercedes-Benz", "AMG"],
    vehicleTypes: ["sedan", "coupe"],
    languages: ["de", "en"],
    category: "clubs",
    isBuiltIn: true,
  },
  {
    name: "JDM Communities",
    description: "Discover JDM enthusiast communities",
    provider: "instagram",
    entityTypes: ["club", "community", "event"],
    keywords: ["JDM", "Japanese cars", "stance meet"],
    hashtags: ["#jdm", "#stance", "#japanese"],
    brands: ["Toyota", "Honda", "Nissan", "Mazda"],
    vehicleTypes: ["coupe", "hatchback"],
    languages: ["en", "ja"],
    category: "communities",
    isBuiltIn: true,
  },
  {
    name: "Performance Shops",
    description: "Discover tuning and performance shops",
    provider: "google_places",
    entityTypes: ["shop", "business"],
    keywords: ["tuning shop", "performance garage", "ECU tuning"],
    hashtags: [],
    brands: [],
    vehicleTypes: [],
    languages: ["en", "de"],
    category: "shops",
    isBuiltIn: true,
  },
  {
    name: "Wrap Shops",
    description: "Discover vehicle wrap and vinyl shops",
    provider: "google_places",
    entityTypes: ["shop", "business"],
    keywords: ["wrap shop", "vinyl wrap", "PPF"],
    hashtags: ["#carwrap", "#vinylwrap"],
    brands: [],
    vehicleTypes: [],
    languages: ["en"],
    category: "shops",
    isBuiltIn: true,
  },
  {
    name: "Detailers",
    description: "Discover automotive detailing businesses",
    provider: "google_places",
    entityTypes: ["shop", "business"],
    keywords: ["car detailer", "auto detailing", "ceramic coating"],
    hashtags: ["#cardetailing"],
    brands: [],
    vehicleTypes: [],
    languages: ["en", "de"],
    category: "shops",
    isBuiltIn: true,
  },
  {
    name: "Race Tracks",
    description: "Discover race tracks and motorsport venues",
    provider: "website",
    entityTypes: ["race_track", "event"],
    keywords: ["race track", "circuit", "motorsport venue"],
    hashtags: [],
    brands: [],
    vehicleTypes: [],
    languages: ["en", "de"],
    category: "venues",
    isBuiltIn: true,
  },
  {
    name: "Car Photographers",
    description: "Discover automotive photographers",
    provider: "instagram",
    entityTypes: ["photographer"],
    keywords: ["car photographer", "automotive photography"],
    hashtags: ["#carshoot", "#automotivephotography"],
    brands: [],
    vehicleTypes: [],
    languages: ["en", "de"],
    category: "creators",
    isBuiltIn: true,
  },
];

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function buildMockResults(
  jobId: string,
  campaignId: string,
  provider: DiscoveryProvider,
  keywords: string[],
  city: string | null,
  country: string | null,
  entityTypes: DiscoveryEntityType[],
): CreateDiscoveryResultInput[] {
  const entityType = entityTypes[0] ?? "unknown";
  const location = city ?? country ?? "Europe";
  const timestamp = new Date().toISOString();

  return keywords.slice(0, 5).map((keyword, index) => {
    const slug = slugify(`${keyword}_${location}_${index}`);
    const url =
      provider === "instagram"
        ? `https://www.instagram.com/${slug}/`
        : provider === "google_places"
          ? `https://maps.google.com/?q=${encodeURIComponent(keyword + " " + location)}`
          : provider === "website"
            ? `https://${slug}.example.com`
            : `https://discovery.revit24.local/${slug}`;

    return {
      jobId,
      campaignId,
      source: provider,
      name: `${keyword} — ${location}`,
      url,
      entityType,
      country,
      city,
      status: index === 4 ? "duplicate" : "new",
      confidence: index < 2 ? "high" : index < 4 ? "medium" : "low",
      isDuplicate: index === 4,
      isQueued: index < 3,
      importRecordId: null,
      createdAt: timestamp,
      metadata: { keyword, seed: true },
    };
  });
}

export function seedDiscoveryEngineMockDataIfEmpty(): void {
  if (mockDiscoveryStore.hasData()) return;

  const templateTimestamp = new Date(now - 30 * 24 * HOURS).toISOString();
  for (const template of BUILTIN_TEMPLATES) {
    mockDiscoveryStore.createTemplate({
      ...template,
      createdAt: templateTimestamp,
      updatedAt: templateTimestamp,
    });
  }

  const campaigns: CreateDiscoveryCampaignInput[] = [
    {
      name: "BMW Clubs Germany",
      description: "Discover BMW enthusiast clubs across Germany",
      country: "Germany",
      state: null,
      city: null,
      area: "Nationwide",
      radius: 500,
      provider: "instagram",
      entityTypes: ["club", "community"],
      keywords: ["BMW club Germany", "BMW Stuttgart", "Bimmer meet Munich"],
      hashtags: ["#bmwclub", "#bimmer", "#bmwde"],
      brands: ["BMW"],
      vehicleTypes: ["sedan", "coupe", "suv"],
      languages: ["de"],
      status: "active",
      createdBy: CREATED_BY,
      createdAt: new Date(now - 5 * HOURS).toISOString(),
      updatedAt: new Date(now - 1 * HOURS).toISOString(),
      templateId: null,
      metadata: { seed: true },
    },
    {
      name: "JDM Clubs Netherlands",
      description: "Japanese car communities in the Netherlands",
      country: "Netherlands",
      state: null,
      city: "Amsterdam",
      area: "Randstad",
      radius: 100,
      provider: "instagram",
      entityTypes: ["club", "community"],
      keywords: ["JDM Netherlands", "stance Amsterdam", "JDM meet"],
      hashtags: ["#jdm", "#stance", "#jdmnl"],
      brands: ["Toyota", "Honda", "Nissan"],
      vehicleTypes: ["coupe", "hatchback"],
      languages: ["nl", "en"],
      status: "active",
      createdBy: CREATED_BY,
      createdAt: new Date(now - 3 * HOURS).toISOString(),
      updatedAt: new Date(now - 0.5 * HOURS).toISOString(),
      templateId: null,
      metadata: { seed: true },
    },
    {
      name: "Tuning Shops Texas",
      description: "Performance and tuning shops in Texas",
      country: "USA",
      state: "Texas",
      city: "Houston",
      area: "Greater Houston",
      radius: 150,
      provider: "google_places",
      entityTypes: ["shop", "business"],
      keywords: ["tuning shop Houston", "performance garage Texas", "ECU tune Dallas"],
      hashtags: [],
      brands: [],
      vehicleTypes: [],
      languages: ["en"],
      status: "active",
      createdBy: CREATED_BY,
      createdAt: new Date(now - 8 * HOURS).toISOString(),
      updatedAt: new Date(now - 2 * HOURS).toISOString(),
      templateId: null,
      metadata: { seed: true },
    },
    {
      name: "Cars & Coffee Europe",
      description: "Cars and coffee events across Europe",
      country: null,
      state: null,
      city: null,
      area: "Europe",
      radius: null,
      provider: "website",
      entityTypes: ["event", "community"],
      keywords: ["cars and coffee", "car meet Europe", "Sunday morning cars"],
      hashtags: ["#carsandcoffee", "#carmeet"],
      brands: [],
      vehicleTypes: [],
      languages: ["en", "de", "fr"],
      status: "paused",
      createdBy: CREATED_BY,
      createdAt: new Date(now - 48 * HOURS).toISOString(),
      updatedAt: new Date(now - 24 * HOURS).toISOString(),
      templateId: null,
      metadata: { seed: true },
    },
  ];

  const createdCampaigns = campaigns.map((campaign) => mockDiscoveryStore.createCampaign(campaign));

  for (const campaign of createdCampaigns) {
    const jobRunning = campaign.name === "BMW Clubs Germany";
    const jobCompleted = campaign.name === "Tuning Shops Texas";

    const jobInput: CreateDiscoveryJobInput = {
      campaignId: campaign.id,
      campaignName: campaign.name,
      provider: campaign.provider,
      status: jobRunning ? "running" : jobCompleted ? "completed" : "queued",
      progress: jobRunning ? 60 : jobCompleted ? 100 : 0,
      totalResults: jobCompleted || jobRunning ? 5 : 0,
      processedResults: jobRunning ? 3 : jobCompleted ? 5 : 0,
      importedResults: jobCompleted ? 4 : jobRunning ? 2 : 0,
      duplicateResults: jobCompleted ? 1 : 0,
      failedResults: 0,
      importJobId: jobCompleted ? "seed_import_disc_1" : null,
      pipelineJobId: jobCompleted ? "seed_pipe_disc_1" : null,
      createdBy: CREATED_BY,
      createdAt: new Date(now - 2 * HOURS).toISOString(),
      updatedAt: new Date().toISOString(),
      startedAt: jobRunning || jobCompleted ? new Date(now - 1.5 * HOURS).toISOString() : null,
      completedAt: jobCompleted ? new Date(now - 0.5 * HOURS).toISOString() : null,
      durationMs: jobCompleted ? 3600000 : null,
      errorMessage: null,
      metadata: { seed: true },
    };

    const job = mockDiscoveryStore.createJob(jobInput);

    if (jobRunning || jobCompleted) {
      mockDiscoveryStore.createResults(
        buildMockResults(
          job.id,
          campaign.id,
          campaign.provider,
          campaign.keywords,
          campaign.city,
          campaign.country,
          campaign.entityTypes,
        ),
      );
    }
  }
}

export function getBuiltinTemplates(): Omit<CreateDiscoveryTemplateInput, "createdAt" | "updatedAt">[] {
  return BUILTIN_TEMPLATES;
}
