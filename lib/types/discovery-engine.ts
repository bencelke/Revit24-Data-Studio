export const DISCOVERY_PROVIDERS = [
  "instagram",
  "google_places",
  "website",
  "csv",
  "manual",
  "facebook",
  "tiktok",
  "youtube",
  "discord",
  "reddit",
] as const;

export type DiscoveryProvider = (typeof DISCOVERY_PROVIDERS)[number];

export const ACTIVE_DISCOVERY_PROVIDERS = [
  "instagram",
  "google_places",
  "website",
  "csv",
  "manual",
] as const;

export type ActiveDiscoveryProvider = (typeof ACTIVE_DISCOVERY_PROVIDERS)[number];

export const DISCOVERY_ENTITY_TYPES = [
  "club",
  "member",
  "shop",
  "event",
  "photographer",
  "videographer",
  "dealer",
  "race_track",
  "community",
  "vendor",
  "business",
  "unknown",
] as const;

export type DiscoveryEntityType = (typeof DISCOVERY_ENTITY_TYPES)[number];

export const DISCOVERY_CAMPAIGN_STATUSES = [
  "draft",
  "active",
  "paused",
  "completed",
  "archived",
] as const;

export type DiscoveryCampaignStatus = (typeof DISCOVERY_CAMPAIGN_STATUSES)[number];

export const DISCOVERY_JOB_STATUSES = [
  "created",
  "queued",
  "running",
  "completed",
  "failed",
  "cancelled",
] as const;

export type DiscoveryJobStatus = (typeof DISCOVERY_JOB_STATUSES)[number];

export const DISCOVERY_RESULT_STATUSES = [
  "new",
  "reviewed",
  "imported",
  "duplicate",
  "rejected",
  "queued",
] as const;

export type DiscoveryResultStatus = (typeof DISCOVERY_RESULT_STATUSES)[number];

export const DISCOVERY_CONFIDENCE_LEVELS = ["low", "medium", "high"] as const;

export type DiscoveryConfidenceLevel = (typeof DISCOVERY_CONFIDENCE_LEVELS)[number];

export interface DiscoveryCampaignDocument {
  id: string;
  name: string;
  description: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  area: string | null;
  radius: number | null;
  provider: DiscoveryProvider;
  entityTypes: DiscoveryEntityType[];
  keywords: string[];
  hashtags: string[];
  brands: string[];
  vehicleTypes: string[];
  languages: string[];
  status: DiscoveryCampaignStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  templateId: string | null;
  metadata: Record<string, unknown> | null;
}

export type CreateDiscoveryCampaignInput = Omit<DiscoveryCampaignDocument, "id">;

export interface DiscoveryJobDocument {
  id: string;
  campaignId: string;
  campaignName: string;
  provider: DiscoveryProvider;
  status: DiscoveryJobStatus;
  progress: number;
  totalResults: number;
  processedResults: number;
  importedResults: number;
  duplicateResults: number;
  failedResults: number;
  importJobId: string | null;
  pipelineJobId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  errorMessage: string | null;
  metadata: Record<string, unknown> | null;
}

export type CreateDiscoveryJobInput = Omit<DiscoveryJobDocument, "id">;

export interface DiscoveryResultDocument {
  id: string;
  jobId: string;
  campaignId: string;
  source: DiscoveryProvider;
  name: string;
  url: string;
  entityType: DiscoveryEntityType;
  country: string | null;
  city: string | null;
  status: DiscoveryResultStatus;
  confidence: DiscoveryConfidenceLevel;
  isDuplicate: boolean;
  isQueued: boolean;
  importRecordId: string | null;
  createdAt: string;
  metadata: Record<string, unknown> | null;
}

export type CreateDiscoveryResultInput = Omit<DiscoveryResultDocument, "id">;

export interface DiscoveryTemplateDocument {
  id: string;
  name: string;
  description: string;
  provider: DiscoveryProvider;
  entityTypes: DiscoveryEntityType[];
  keywords: string[];
  hashtags: string[];
  brands: string[];
  vehicleTypes: string[];
  languages: string[];
  category: string;
  isBuiltIn: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateDiscoveryTemplateInput = Omit<DiscoveryTemplateDocument, "id">;

export interface DiscoveryDashboardStats {
  activeCampaigns: number;
  runningJobs: number;
  completedToday: number;
  newResults: number;
  importQueue: number;
  reviewQueue: number;
}

export interface DiscoveryDashboardData {
  stats: DiscoveryDashboardStats;
  recentCampaigns: DiscoveryCampaignDocument[];
  recentJobs: DiscoveryJobDocument[];
  recentResults: DiscoveryResultDocument[];
  dataMode: "firestore" | "mock";
  firebaseConfigured: boolean;
  warning?: string;
}

export interface DiscoveryCampaignDetailData {
  campaign: DiscoveryCampaignDocument;
  jobs: DiscoveryJobDocument[];
  results: DiscoveryResultDocument[];
  dataMode: "firestore" | "mock";
  firebaseConfigured: boolean;
}

export interface KeywordBuilderInput {
  country?: string | null;
  city?: string | null;
  area?: string | null;
  keyword?: string | null;
  brand?: string | null;
  vehicleType?: string | null;
  hashtag?: string | null;
  businessCategory?: string | null;
}

export interface DiscoveryCampaignListResult {
  campaigns: DiscoveryCampaignDocument[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DiscoveryJobListResult {
  jobs: DiscoveryJobDocument[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DiscoveryResultListResult {
  results: DiscoveryResultDocument[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateCampaignPayload {
  name: string;
  description?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  area?: string | null;
  radius?: number | null;
  provider: DiscoveryProvider;
  entityTypes: DiscoveryEntityType[];
  keywords?: string[];
  hashtags?: string[];
  brands?: string[];
  vehicleTypes?: string[];
  languages?: string[];
  templateId?: string | null;
  status?: DiscoveryCampaignStatus;
}
