export const REVIEW_RECORD_STATUSES = [
  "pending_review",
  "approved",
  "rejected",
  "duplicate",
  "needs_edit",
  "merged",
] as const;

export type ReviewRecordStatus = (typeof REVIEW_RECORD_STATUSES)[number];

export type ReviewAction =
  | "approve"
  | "reject"
  | "needs_edit"
  | "mark_duplicate"
  | "merge_later"
  | "approve_anyway"
  | "ignore"
  | "save_notes"
  | "reopen";

export type ReviewRole = "admin" | "reviewer" | "collector";

export interface ReviewPermissions {
  canApprove: boolean;
  canReject: boolean;
  canEdit: boolean;
  canMerge: boolean;
  readOnly: boolean;
}

export const REVIEW_ROLE_PERMISSIONS: Record<ReviewRole, ReviewPermissions> = {
  admin: {
    canApprove: true,
    canReject: true,
    canEdit: true,
    canMerge: true,
    readOnly: false,
  },
  reviewer: {
    canApprove: true,
    canReject: true,
    canEdit: true,
    canMerge: false,
    readOnly: false,
  },
  collector: {
    canApprove: false,
    canReject: false,
    canEdit: false,
    canMerge: false,
    readOnly: true,
  },
};

export interface ReviewRecordFields {
  reviewStatus: ReviewRecordStatus;
  displayName: string | null;
  importSource: string;
  reviewer: string | null;
  website: string | null;
  publicEmail: string | null;
  tags: string[];
  country: string | null;
  city: string | null;
  description: string | null;
}

export interface ReviewRecordNote {
  reviewer: string;
  timestamp: string;
  message: string;
}

export interface ApprovedRecordDocument {
  id: string;
  importRecordId: string;
  jobId: string;
  username: string | null;
  profileUrl: string | null;
  displayName: string | null;
  importSource: string;
  website: string | null;
  publicEmail: string | null;
  tags: string[];
  country: string | null;
  city: string | null;
  description: string | null;
  approvedBy: string;
  approvedAt: string;
  metadata: Record<string, unknown> | null;
}

export type CreateApprovedRecordInput = Omit<ApprovedRecordDocument, "id">;

export interface ReviewHistoryEntry {
  id: string;
  recordId: string;
  previousStatus: ReviewRecordStatus;
  newStatus: ReviewRecordStatus;
  reviewer: string;
  timestamp: string;
  reason: string | null;
  notes: string | null;
}

export type CreateReviewHistoryInput = Omit<ReviewHistoryEntry, "id">;

export interface ReviewDashboardStats {
  pendingReview: number;
  approvedToday: number;
  rejectedToday: number;
  needsEdit: number;
  duplicates: number;
  averageReviewTimeMinutes: number;
}

export interface ReviewRecordView extends ReviewRecordFields {
  id: string;
  jobId: string;
  jobName: string;
  originalInput: string;
  username: string | null;
  profileUrl: string | null;
  validationStatus: import("./import-jobs").ImportRecordStatus;
  error: string | null;
  duplicateOf: string | null;
  createdAt: string;
  updatedAt: string;
  notes: ReviewRecordNote[];
}

export type ReviewSortField =
  | "username"
  | "displayName"
  | "importSource"
  | "jobName"
  | "reviewStatus"
  | "createdAt"
  | "reviewer";

export type ReviewSortDirection = "asc" | "desc";

export interface ReviewFilterParams {
  search?: string;
  reviewStatus?: ReviewRecordStatus | "all";
  importSource?: string | "all";
  sortField?: ReviewSortField;
  sortDirection?: ReviewSortDirection;
  page?: number;
  pageSize?: number;
}

export interface ReviewListResult {
  records: ReviewRecordView[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ReviewActivityItem {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
  status: "success" | "pending" | "warning";
}

export interface ReviewDashboardData {
  stats: ReviewDashboardStats;
  records: ReviewRecordView[];
  recentActivity: ReviewActivityItem[];
  dataMode: import("./import-jobs").ImportDataMode;
  firebaseConfigured: boolean;
  warning?: string;
}

export interface ReviewRecordDetailData {
  record: ReviewRecordView;
  history: ReviewHistoryEntry[];
  dataMode: import("./import-jobs").ImportDataMode;
  firebaseConfigured: boolean;
  permissions: ReviewPermissions;
}

export interface NeedsEditPayload {
  displayName?: string | null;
  username?: string | null;
  website?: string | null;
  publicEmail?: string | null;
  tags?: string[];
  country?: string | null;
  city?: string | null;
  description?: string | null;
  notes?: string | null;
}

export interface ReviewActionPayload {
  action: ReviewAction;
  notes?: string | null;
  reason?: string | null;
  edits?: NeedsEditPayload;
  reviewer?: string;
}

export function getDefaultReviewPermissions(): ReviewPermissions {
  return REVIEW_ROLE_PERMISSIONS.admin;
}

export function createDefaultReviewFields(
  validationStatus: import("./import-jobs").ImportRecordStatus,
  importSource = "instagram",
): ReviewRecordFields {
  return {
    reviewStatus:
      validationStatus === "valid"
        ? "pending_review"
        : validationStatus === "duplicate"
          ? "duplicate"
          : "rejected",
    displayName: null,
    importSource,
    reviewer: null,
    website: null,
    publicEmail: null,
    tags: [],
    country: null,
    city: null,
    description: null,
  };
}
