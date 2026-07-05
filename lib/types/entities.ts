export type RecordStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected"
  | "duplicate"
  | "imported";

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface ImportRecord extends BaseEntity {
  source: string;
  sourceType: "instagram" | "google_places" | "website" | "csv" | "manual";
  status: RecordStatus;
  rawPayload: Record<string, unknown>;
  classifiedAt: Date | null;
  reviewedAt: Date | null;
  reviewedBy: string | null;
}

export interface ProfileRecord extends BaseEntity {
  username: string;
  platform: "instagram";
  displayName: string | null;
  bio: string | null;
  followerCount: number | null;
  status: RecordStatus;
  importId: string | null;
}

export interface BusinessRecord extends BaseEntity {
  name: string;
  category: string;
  address: string | null;
  placeId: string | null;
  website: string | null;
  phone: string | null;
  status: RecordStatus;
  importId: string | null;
}

export interface EventRecord extends BaseEntity {
  title: string;
  description: string | null;
  location: string | null;
  startDate: Date | null;
  endDate: Date | null;
  status: RecordStatus;
  importId: string | null;
}

export interface LogRecord extends BaseEntity {
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  severity: "info" | "warning" | "error";
}

export interface JobRecord extends BaseEntity {
  type: string;
  status: "queued" | "running" | "completed" | "failed";
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  error: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
}
