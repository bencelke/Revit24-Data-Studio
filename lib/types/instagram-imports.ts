export type InstagramProfileInputStatus = "valid" | "duplicate" | "invalid";

export interface InstagramProfileInput {
  lineNumber: number;
  originalInput: string;
  username: string | null;
  profileUrl: string | null;
  status: InstagramProfileInputStatus;
  error: string | null;
  duplicateOf: string | null;
}

export interface InstagramProfileInputSummary {
  totalLines: number;
  validProfiles: number;
  duplicates: number;
  invalidRows: number;
}

export interface InstagramProfileBulkParseResult {
  rows: InstagramProfileInput[];
  summary: InstagramProfileInputSummary;
}

export interface InstagramProfileImportRecord {
  id: string;
  jobId: string;
  originalInput: string;
  username: string | null;
  profileUrl: string | null;
  status: InstagramProfileInputStatus;
  error: string | null;
  duplicateOf: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InstagramProfileImportJob {
  id: string;
  name: string;
  type: "instagram_profile_links";
  source: "instagram";
  status: "draft" | "queued";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  totalRecords: number;
  validRecords: number;
  duplicateRecords: number;
  invalidRecords: number;
  notes: string | null;
  records?: InstagramProfileImportRecord[];
}

export type ImportDataMode = "firestore" | "mock";

export interface CreateInstagramImportJobResult {
  job: InstagramProfileImportJob;
  records: InstagramProfileImportRecord[];
  dataMode: ImportDataMode;
  warning?: string;
}

export interface ImportHistoryData {
  jobs: import("./imports").ImportJob[];
  dataMode: ImportDataMode;
  firebaseConfigured: boolean;
}

export const DISCOVERY_PLATFORMS = [
  "instagram",
  "google_places",
  "website",
  "tiktok",
  "youtube",
] as const;

export const DISCOVERY_QUERY_TYPES = [
  "topic",
  "location",
  "hashtag",
  "keyword",
  "business_category",
] as const;

export const DISCOVERY_TARGET_STATUSES = [
  "planned",
  "researching",
  "ready",
  "archived",
] as const;

export type DiscoveryPlatform = (typeof DISCOVERY_PLATFORMS)[number];
export type DiscoveryQueryType = (typeof DISCOVERY_QUERY_TYPES)[number];
export type DiscoveryTargetStatus = (typeof DISCOVERY_TARGET_STATUSES)[number];

export interface DiscoveryTarget {
  id: string;
  name: string;
  platform: DiscoveryPlatform;
  queryType: DiscoveryQueryType;
  query: string;
  country: string | null;
  city: string | null;
  tags: string[];
  status: DiscoveryTargetStatus;
  notes: string | null;
  createdAt: string;
}
