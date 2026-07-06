import type { InstagramEntityType } from "@/lib/types/instagramExtraction";

export type JsonExportScope = "all" | "successful" | "clubs" | "members";

export interface InstagramJsonExportOptions {
  scope?: JsonExportScope;
}

export interface InstagramJsonExportRecord {
  source: "instagram";
  entityType: InstagramEntityType;
  username: string;
  profileUrl: string;
  displayName: string | null;
  profileImageUrl: string | null;
  bio: string | null;
  website: string | null;
  publicEmail: string | null;
  status: string;
  errorCode: string | null;
  errorMessage: string | null;
  extractedAt: string;
}

export interface InstagramJsonExportSummary {
  clubs: number;
  members: number;
  unknown: number;
  success: number;
  failed: number;
}

export interface InstagramJsonExportPayload {
  exportedAt: string;
  source: "revit24-data-studio";
  version: "1.0";
  recordCount: number;
  summary: InstagramJsonExportSummary;
  records: InstagramJsonExportRecord[];
}

export const INSTAGRAM_JSON_EXPORT_VERSION = "1.0" as const;

function isSuccessfulStatus(status: string): boolean {
  return status === "success" || status === "completed" || status === "mock";
}

export function filterRecordsForExportScope(
  records: InstagramJsonExportRecord[],
  scope: JsonExportScope,
): InstagramJsonExportRecord[] {
  switch (scope) {
    case "successful":
      return records.filter((record) => isSuccessfulStatus(record.status));
    case "clubs":
      return records.filter(
        (record) => record.entityType === "club" && isSuccessfulStatus(record.status),
      );
    case "members":
      return records.filter(
        (record) => record.entityType === "member" && isSuccessfulStatus(record.status),
      );
    default:
      return records;
  }
}

export function buildInstagramJsonExportSummary(
  records: InstagramJsonExportRecord[],
): InstagramJsonExportSummary {
  const summary: InstagramJsonExportSummary = {
    clubs: 0,
    members: 0,
    unknown: 0,
    success: 0,
    failed: 0,
  };

  for (const record of records) {
    if (record.entityType === "club") summary.clubs += 1;
    else if (record.entityType === "member") summary.members += 1;
    else summary.unknown += 1;

    if (isSuccessfulStatus(record.status)) {
      summary.success += 1;
    } else if (record.status === "failed") {
      summary.failed += 1;
    }
  }

  return summary;
}

export function createInstagramJsonExportPayload(
  records: InstagramJsonExportRecord[],
  options: InstagramJsonExportOptions = {},
): InstagramJsonExportPayload {
  const scope = options.scope ?? "successful";
  const filtered = filterRecordsForExportScope(records, scope);

  return {
    exportedAt: new Date().toISOString(),
    source: "revit24-data-studio",
    version: INSTAGRAM_JSON_EXPORT_VERSION,
    recordCount: filtered.length,
    summary: buildInstagramJsonExportSummary(filtered),
    records: filtered,
  };
}

export function exportInstagramProfilesToJson(
  records: InstagramJsonExportRecord[],
  options: InstagramJsonExportOptions = {},
): string {
  return JSON.stringify(createInstagramJsonExportPayload(records, options), null, 2);
}

export function buildInstagramProfilesJsonFilename(date = new Date()): string {
  return `revit24-instagram-profiles-${date.toISOString().slice(0, 10)}.json`;
}

export function downloadJsonFile(payload: unknown, filename: string): void {
  const json = typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
