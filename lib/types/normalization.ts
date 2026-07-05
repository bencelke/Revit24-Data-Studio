export const ENTITY_TYPES = [
  "Club",
  "Member",
  "Shop",
  "Detailer",
  "Wrap Shop",
  "Tint Shop",
  "Wheel Shop",
  "Performance Shop",
  "Dyno Shop",
  "Photographer",
  "Videographer",
  "Content Creator",
  "Dealer",
  "Track",
  "Event Organizer",
  "Car Event",
  "Community Zone",
  "Unknown",
] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];

export const NORMALIZED_RECORD_STATUSES = [
  "pending_review",
  "approved",
  "rejected",
  "needs_edit",
  "archived",
] as const;

export type NormalizedRecordStatus = (typeof NORMALIZED_RECORD_STATUSES)[number];

export const NORMALIZATION_SOURCES = [
  "instagram",
  "google_places",
  "website",
  "tiktok",
  "youtube",
  "csv",
  "manual",
] as const;

export type NormalizationSource = (typeof NORMALIZATION_SOURCES)[number];

export const MATCH_CONFIDENCE_LEVELS = [
  "high",
  "medium",
  "low",
  "possible",
  "none",
] as const;

export type MatchConfidenceLevel = (typeof MATCH_CONFIDENCE_LEVELS)[number];

export const SOCIAL_PLATFORMS = [
  "instagram",
  "facebook",
  "tiktok",
  "youtube",
  "website",
  "discord",
  "telegram",
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export type SocialLinks = Partial<Record<SocialPlatform, string | null>>;

export const AUTOMOTIVE_TAGS = [
  "BMW",
  "Mercedes",
  "Audi",
  "VW",
  "Porsche",
  "Toyota",
  "Honda",
  "JDM",
  "Euro",
  "Muscle",
  "Classic",
  "Drift",
  "Track",
  "Tuning",
  "Wrap",
  "Detailing",
  "Ceramic",
  "Dyno",
  "Photography",
  "Meet",
  "Cars & Coffee",
  "Night Cruise",
] as const;

export type AutomotiveTag = (typeof AUTOMOTIVE_TAGS)[number];

export interface RawExtractedMetadata {
  source: NormalizationSource;
  sourceRecordId: string;
  displayName: string | null;
  username: string | null;
  bio: string | null;
  website: string | null;
  publicEmail: string | null;
  publicPhone: string | null;
  profileUrl: string | null;
  businessCategory: string | null;
  country: string | null;
  city: string | null;
  verified: boolean;
  state?: string | null;
  area?: string | null;
  postalCode?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface NormalizedRecordDocument {
  id: string;
  source: NormalizationSource;
  sourceRecordId: string;
  entityType: EntityType;
  displayName: string;
  username: string | null;
  website: string | null;
  publicEmail: string | null;
  publicPhone: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  area: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  tags: string[];
  vehicleBrands: string[];
  specialties: string[];
  socialLinks: SocialLinks;
  status: NormalizedRecordStatus;
  confidenceScore: number;
  normalizedAt: string;
  workerVersion: string;
}

export type CreateNormalizedRecordInput = Omit<NormalizedRecordDocument, "id">;

export interface EntityMatchDocument {
  id: string;
  normalizedRecordId: string;
  matchedRecordId: string;
  matchedDisplayName: string;
  matchFields: string[];
  confidenceLevel: MatchConfidenceLevel;
  confidenceScore: number;
  createdAt: string;
}

export type CreateEntityMatchInput = Omit<EntityMatchDocument, "id">;

export interface NormalizationLogDocument {
  id: string;
  normalizedRecordId: string;
  timestamp: string;
  event: string;
  message: string;
  details: Record<string, unknown> | null;
}

export type CreateNormalizationLogInput = Omit<NormalizationLogDocument, "id">;

export interface NormalizationResult {
  record: NormalizedRecordDocument;
  matches: EntityMatchDocument[];
}

export interface EntitiesDashboardStats {
  totalNormalized: number;
  pendingReview: number;
  approved: number;
  highConfidenceMatches: number;
}

export interface EntitiesListData {
  records: NormalizedRecordDocument[];
  stats: EntitiesDashboardStats;
  dataMode: "firestore" | "mock";
  firebaseConfigured: boolean;
  warning?: string;
}

export interface EntityDetailData {
  record: NormalizedRecordDocument;
  matches: EntityMatchDocument[];
  logs: NormalizationLogDocument[];
  dataMode: "firestore" | "mock";
  firebaseConfigured: boolean;
}

export interface PipelineDashboardStats {
  rawImports: number;
  extractionJobs: number;
  normalizedRecords: number;
  pendingReview: number;
  approved: number;
}
