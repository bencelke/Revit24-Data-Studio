import { MOCK_DISCOVERY_TARGETS } from "@/lib/mock-data/discoveryTargets";
import { parseInstagramBulkInput } from "@/lib/validation/instagramProfileInput";
import {
  createImportJobFromBulkInput,
  createImportJobFromText,
  getImportHistoryData,
  getImportJobWithRecords,
  isImportFirestoreAvailable,
  mapImportJobDocumentToLegacyJob,
} from "@/lib/services/importJobService";
import type {
  CreateImportJobResult,
  DiscoveryTarget,
  ImportHistoryData,
  ImportJobDocument,
  ImportJobWithRecords,
  InstagramProfileBulkParseResult,
} from "@/lib/types/import-jobs";

export type {
  CreateImportJobResult as CreateInstagramImportJobResult,
  ImportHistoryData,
  InstagramProfileBulkParseResult,
};

export type InstagramProfileImportJob = ImportJobDocument;
export type InstagramProfileImportRecord = ImportJobWithRecords["records"][number];

export {
  createImportJobFromText as createInstagramProfileImportJobFromText,
  getImportHistoryData,
  getImportJobWithRecords as getInstagramProfileImportJobWithRecords,
  isImportFirestoreAvailable as isInstagramImportFirestoreAvailable,
  mapImportJobDocumentToLegacyJob as mapInstagramJobToImportJob,
};

export function parseAndPrepareBulkInput(text: string): InstagramProfileBulkParseResult {
  return parseInstagramBulkInput(text);
}

/** @deprecated Use createInstagramProfileImportJobFromText */
export async function createInstagramProfileImportJob(
  name: string,
  parseResult: InstagramProfileBulkParseResult,
): Promise<ImportJobDocument> {
  const result = await createImportJobFromBulkInput(parseResult, name);
  return result.job;
}

/** @deprecated Use getInstagramProfileImportJobWithRecords */
export async function getInstagramProfileImportJobById(
  id: string,
): Promise<ImportJobWithRecords | null> {
  return getImportJobWithRecords(id);
}

export function getInstagramProfileImportJobs(): ImportJobDocument[] {
  return [];
}

export function getMockInstagramProfileImportJobById(): null {
  return null;
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
