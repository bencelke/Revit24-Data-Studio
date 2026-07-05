export const WEBSITE_JOB_STATUSES = [
  "pending",
  "running",
  "completed",
  "failed",
  "cancelled",
] as const;

export type WebsiteJobStatus = (typeof WEBSITE_JOB_STATUSES)[number];

export const WEBSITE_RAW_STATUSES = [
  "discovered",
  "extracted",
  "imported",
  "queued",
  "rejected",
  "duplicate",
  "failed",
  "pending_review",
] as const;

export type WebsiteRawStatus = (typeof WEBSITE_RAW_STATUSES)[number];

export const WEBSITE_TYPES = [
  "Car Club",
  "Performance Shop",
  "Detailer",
  "Wrap Shop",
  "Tint Shop",
  "Wheel Shop",
  "Tuning Shop",
  "Race Track",
  "Car Event Website",
  "Photography",
  "Videography",
  "Parts Store",
  "Dealership",
  "Automotive Blog",
  "Motorsport Organization",
] as const;

export type WebsiteType = (typeof WEBSITE_TYPES)[number];

export const WEBSITE_SOCIAL_PLATFORMS = [
  "instagram",
  "facebook",
  "tiktok",
  "youtube",
  "linkedin",
  "discord",
  "telegram",
  "x",
  "pinterest",
  "website",
] as const;

export type WebsiteSocialPlatform = (typeof WEBSITE_SOCIAL_PLATFORMS)[number];

export type WebsiteSocialLinks = Partial<Record<WebsiteSocialPlatform, string | null>>;

export interface DetectedEmail {
  email: string;
  confidence: "high" | "medium" | "low";
  source: string;
}

export interface DetectedPhone {
  phone: string;
  confidence: "high" | "medium" | "low";
  source: string;
}

export interface WebsiteJobDocument {
  id: string;
  status: WebsiteJobStatus;
  inputType: "single" | "bulk" | "csv" | "domain";
  urls: string[];
  createdBy: string;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  totalUrls: number;
  processedUrls: number;
  successfulUrls: number;
  failedUrls: number;
  respectRobotsTxt: boolean;
}

export type CreateWebsiteJobInput = Omit<WebsiteJobDocument, "id">;

export interface WebsiteRawDocument {
  id: string;
  jobId: string;
  url: string;
  domain: string;
  title: string;
  metaDescription: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  publicEmails: DetectedEmail[];
  publicPhones: DetectedPhone[];
  address: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  postalCode: string | null;
  socialLinks: WebsiteSocialLinks;
  contactPage: string | null;
  aboutPage: string | null;
  privacyPage: string | null;
  businessHours: string[];
  detectedLanguage: string | null;
  detectedBusinessType: WebsiteType | null;
  googleMapsUrl: string | null;
  status: WebsiteRawStatus;
  source: "website";
  createdAt: string;
}

export type CreateWebsiteRawInput = Omit<WebsiteRawDocument, "id">;

export interface WebsiteDuplicateMatch {
  matchedId: string;
  matchedName: string;
  matchFields: string[];
  confidenceScore: number;
  confidenceLevel: "high" | "medium" | "low" | "possible";
  matchedSource: "website_raw" | "normalized_records";
}

export interface WebsiteImportResult {
  imported: number;
  queued: number;
  rejected: number;
  duplicates: number;
  failed: number;
}

export interface WebsitesHubPageData {
  jobs: WebsiteJobDocument[];
  dataMode: "firestore" | "mock";
  firebaseConfigured: boolean;
  workerAvailable: boolean;
  warning?: string;
}

export interface WebsiteResultsPageData {
  job: WebsiteJobDocument;
  websites: WebsiteRawDocument[];
  dataMode: "firestore" | "mock";
  firebaseConfigured: boolean;
  workerAvailable: boolean;
}

export interface WebsiteDetailPageData {
  website: WebsiteRawDocument;
  duplicates: WebsiteDuplicateMatch[];
  normalizationPreview: import("./normalization").CreateNormalizedRecordInput | null;
  dataMode: "firestore" | "mock";
  firebaseConfigured: boolean;
  workerAvailable: boolean;
}
