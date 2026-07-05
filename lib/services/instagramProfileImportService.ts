import { MOCK_DISCOVERY_TARGETS } from "@/lib/mock-data/discoveryTargets";
import type {
  DiscoveryTarget,
  InstagramProfileBulkParseResult,
  InstagramProfileImportJob,
  InstagramProfileImportRecord,
} from "@/lib/types/instagram-imports";

const mockInstagramProfileJobs: InstagramProfileImportJob[] = [];

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createInstagramProfileImportJob(
  name: string,
  parseResult: InstagramProfileBulkParseResult,
  createdBy = "collector@revit24.com",
): InstagramProfileImportJob {
  const jobId = generateId("ig_job");
  const createdAt = new Date().toISOString();

  const records: InstagramProfileImportRecord[] = parseResult.rows.map((row) => ({
    id: generateId("ig_rec"),
    jobId,
    originalInput: row.originalInput,
    username: row.username,
    profileUrl: row.profileUrl,
    status: row.status,
    error: row.error,
    duplicateOf: row.duplicateOf,
    createdAt,
  }));

  const job: InstagramProfileImportJob = {
    id: jobId,
    name,
    type: "instagram_profile_links",
    source: "instagram",
    status: parseResult.summary.validProfiles > 0 ? "queued" : "draft",
    createdBy,
    createdAt,
    totalRecords: parseResult.summary.totalLines,
    validRecords: parseResult.summary.validProfiles,
    duplicateRecords: parseResult.summary.duplicates,
    invalidRecords: parseResult.summary.invalidRows,
    records,
  };

  mockInstagramProfileJobs.unshift(job);
  return job;
}

export function getInstagramProfileImportJobs(): InstagramProfileImportJob[] {
  return [...mockInstagramProfileJobs];
}

export function getInstagramProfileImportJobById(
  id: string,
): InstagramProfileImportJob | null {
  return mockInstagramProfileJobs.find((job) => job.id === id) ?? null;
}

export function getDiscoveryTargets(): DiscoveryTarget[] {
  return MOCK_DISCOVERY_TARGETS;
}

export function getDiscoveryPlatformLabel(
  platform: DiscoveryTarget["platform"],
): string {
  const labels: Record<DiscoveryTarget["platform"], string> = {
    instagram: "Instagram",
    google_places: "Google Places",
    website: "Website",
    tiktok: "TikTok",
    youtube: "YouTube",
  };

  return labels[platform];
}

export function getDiscoveryQueryTypeLabel(
  queryType: DiscoveryTarget["queryType"],
): string {
  const labels: Record<DiscoveryTarget["queryType"], string> = {
    topic: "Topic",
    location: "Location",
    hashtag: "Hashtag",
    keyword: "Keyword",
    business_category: "Business Category",
  };

  return labels[queryType];
}

export function getDiscoveryStatusLabel(
  status: DiscoveryTarget["status"],
): string {
  const labels: Record<DiscoveryTarget["status"], string> = {
    planned: "Planned",
    researching: "Researching",
    ready: "Ready",
    archived: "Archived",
  };

  return labels[status];
}
