import type { MatchConfidenceLevel, NormalizedRecordDocument } from "./normalization";

export const ENTITY_MATCH_STATUSES = [
  "pending",
  "resolved",
  "ignored",
  "needs_review",
] as const;

export type EntityMatchStatus = (typeof ENTITY_MATCH_STATUSES)[number];

export const MATCH_RESOLUTIONS = [
  "merge",
  "keep_separate",
  "mark_duplicate",
  "approve_both",
] as const;

export type MatchResolution = (typeof MATCH_RESOLUTIONS)[number];

export const MATCH_REASONS = [
  "same_instagram",
  "same_website",
  "same_domain",
  "same_email",
  "same_phone",
  "same_google_place_id",
  "same_name_city",
  "similar_name",
  "nearby_coordinates",
  "manual_flag",
] as const;

export type MatchReason = (typeof MATCH_REASONS)[number];

export const MATCH_TYPES = ["automatic", "manual"] as const;

export type MatchType = (typeof MATCH_TYPES)[number];

export const MERGE_FIELD_KEYS = [
  "displayName",
  "entityType",
  "username",
  "website",
  "publicEmail",
  "publicPhone",
  "location",
  "description",
  "tags",
  "vehicleBrands",
  "specialties",
  "socialLinks",
] as const;

export type MergeFieldKey = (typeof MERGE_FIELD_KEYS)[number];

export type MergeFieldSelection = "record_a" | "record_b" | "combine" | "clear";

export type MergeFieldSelections = Partial<Record<MergeFieldKey, MergeFieldSelection>>;

export const MERGE_ACTIONS = [
  "merge",
  "mark_duplicate",
  "keep_separate",
  "ignore_match",
  "approve_both",
  "needs_review",
] as const;

export type MergeAction = (typeof MERGE_ACTIONS)[number];

export interface EntityMatchDocument {
  id: string;
  recordAId: string;
  recordBId: string;
  matchType: MatchType;
  confidence: MatchConfidenceLevel;
  confidenceScore: number;
  status: EntityMatchStatus;
  reasons: MatchReason[];
  createdAt: string;
  updatedAt: string;
  resolvedBy: string | null;
  resolvedAt: string | null;
  resolution: MatchResolution | null;
  notes: string | null;
  matchedDisplayName?: string;
}

export type CreateEntityMatchInput = Omit<EntityMatchDocument, "id">;

export interface MergeHistoryDocument {
  id: string;
  matchId: string;
  recordAId: string;
  recordBId: string;
  action: MergeAction;
  performedBy: string;
  performedAt: string;
  notes: string | null;
  fieldSelections: MergeFieldSelections | null;
  resultRecordId: string | null;
}

export type CreateMergeHistoryInput = Omit<MergeHistoryDocument, "id">;

export interface DuplicateDashboardStats {
  pendingMatches: number;
  highConfidence: number;
  mediumConfidence: number;
  lowConfidence: number;
  resolvedToday: number;
  ignoredToday: number;
}

export interface DuplicateMatchView extends EntityMatchDocument {
  recordAName: string;
  recordBName: string;
}

export interface DuplicateListResult {
  matches: DuplicateMatchView[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DuplicateFilterParams {
  search?: string;
  status?: EntityMatchStatus | "all";
  confidence?: MatchConfidenceLevel | "all";
  reason?: MatchReason | "all";
  page?: number;
  pageSize?: number;
  sortField?: "createdAt" | "confidenceScore" | "status";
  sortDirection?: "asc" | "desc";
}

export interface DuplicatesDashboardData {
  stats: DuplicateDashboardStats;
  recentMatches: DuplicateMatchView[];
  dataMode: "firestore" | "mock";
  firebaseConfigured: boolean;
  warning?: string;
}

export interface DuplicateMatchDetailData {
  match: EntityMatchDocument;
  recordA: NormalizedRecordDocument;
  recordB: NormalizedRecordDocument;
  history: MergeHistoryDocument[];
  dataMode: "firestore" | "mock";
  firebaseConfigured: boolean;
}

export interface MergePreviewData {
  recordA: NormalizedRecordDocument;
  recordB: NormalizedRecordDocument;
  preview: CreateNormalizedRecordInputPreview;
  defaultSelections: MergeFieldSelections;
}

export interface CreateNormalizedRecordInputPreview {
  displayName: string;
  entityType: string;
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
  socialLinks: NormalizedRecordDocument["socialLinks"];
}

export interface ResolveMatchPayload {
  action: MergeAction;
  notes?: string;
  fieldSelections?: MergeFieldSelections;
  performedBy?: string;
}
