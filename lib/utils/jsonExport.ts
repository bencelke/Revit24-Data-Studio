export interface InstagramJsonExportRecord {
  source: "instagram";
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

export interface InstagramJsonExportPayload {
  exportedAt: string;
  source: "revit24-data-studio";
  version: "1.0";
  recordCount: number;
  records: InstagramJsonExportRecord[];
}

export const INSTAGRAM_JSON_EXPORT_VERSION = "1.0" as const;

export function createInstagramExportPayload(
  records: InstagramJsonExportRecord[],
): InstagramJsonExportPayload {
  return {
    exportedAt: new Date().toISOString(),
    source: "revit24-data-studio",
    version: INSTAGRAM_JSON_EXPORT_VERSION,
    recordCount: records.length,
    records,
  };
}

export function exportInstagramResultsToJson(records: InstagramJsonExportRecord[]): string {
  return JSON.stringify(createInstagramExportPayload(records), null, 2);
}

export function buildInstagramJsonExportFilename(date = new Date()): string {
  return `revit24-instagram-export-${date.toISOString().slice(0, 10)}.json`;
}

export function downloadJsonFile(data: unknown, filename: string): void {
  const json = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
