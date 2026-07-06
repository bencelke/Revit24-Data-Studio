export {
  extractSimpleInstagramProfiles as extractInstagramSimpleProfiles,
  uploadToRevit24ImportQueue as sendToRevit24ImportQueue,
  getSimpleImportPageData as getInstagramSimpleImportPageData,
} from "@/lib/services/simpleInstagramImportService";

import { buildSimpleInstagramCsv } from "@/lib/utils/csvExport";
import type { SimpleExtractedProfile } from "@/lib/types/simpleInstagramImport";

/** @deprecated Use buildSimpleInstagramCsv */
export function buildInstagramSimpleImportCsv(
  rows: Array<{
    username: string;
    profileUrl: string;
    displayName: string | null;
    profileImageUrl: string | null;
    publicEmail: string | null;
    extractionStatus?: string;
    status?: string;
    error: string | null;
    extractedAt: string | null;
    bio?: string | null;
    website?: string | null;
  }>,
): string {
  const mapped: SimpleExtractedProfile[] = rows.map((row) => {
    const timestamp = row.extractedAt ?? new Date().toISOString();
    return {
      id: "legacy",
      source: "instagram" as const,
      username: row.username,
      profileUrl: row.profileUrl,
      displayName: row.displayName,
      profileImageUrl: row.profileImageUrl,
      bio: row.bio ?? null,
      website: row.website ?? null,
      publicEmail: row.publicEmail,
      status: (row.status ?? row.extractionStatus ?? "completed") as SimpleExtractedProfile["status"],
      error: row.error,
      errorCode: null,
      extractedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  });
  return buildSimpleInstagramCsv(mapped);
}
