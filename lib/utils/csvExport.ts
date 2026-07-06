import type { ExtractedInstagramProfile } from "@/lib/types/instagramExtraction";

function escapeCsvValue(value: string | null | undefined): string {
  const safe = value ?? "";
  if (safe.includes(",") || safe.includes('"') || safe.includes("\n")) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export function buildInstagramExtractionCsv(rows: ExtractedInstagramProfile[]): string {
  const header =
    "username,profileUrl,profileImageUrl,displayName,bio,website,publicEmail,status,errorCode,errorMessage,error,extractedAt";

  const lines = rows.map((row) =>
    [
      escapeCsvValue(row.username),
      escapeCsvValue(row.profileUrl),
      escapeCsvValue(row.profileImageUrl),
      escapeCsvValue(row.displayName),
      escapeCsvValue(row.bio),
      escapeCsvValue(row.website),
      escapeCsvValue(row.publicEmail),
      escapeCsvValue(row.status),
      escapeCsvValue(row.errorCode),
      escapeCsvValue(row.errorMessage),
      escapeCsvValue(row.error),
      escapeCsvValue(row.extractedAt),
    ].join(","),
  );

  return [header, ...lines].join("\n");
}

/** @deprecated Use buildInstagramExtractionCsv */
export function buildSimpleInstagramCsv(
  rows: Array<{
    username: string;
    profileUrl: string;
    profileImageUrl: string | null;
    displayName: string | null;
    bio?: string | null;
    website?: string | null;
    publicEmail: string | null;
    status: string;
    error: string | null;
    extractedAt: string | null;
  }>,
): string {
  const mapped: ExtractedInstagramProfile[] = rows.map((row, index) => {
    const timestamp = row.extractedAt ?? new Date().toISOString();
    return {
      id: `legacy_${index}`,
      source: "instagram" as const,
      username: row.username,
      profileUrl: row.profileUrl,
      profileImageUrl: row.profileImageUrl,
      displayName: row.displayName,
      bio: row.bio ?? null,
      website: row.website ?? null,
      publicEmail: row.publicEmail,
      status: row.status as ExtractedInstagramProfile["status"],
      error: row.error,
      errorCode: null,
      errorMessage: null,
      extractedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  });
  return buildInstagramExtractionCsv(mapped);
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
