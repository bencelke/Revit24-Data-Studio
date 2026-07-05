import type { CsvMappedRow } from "@/lib/types/csv-import";
import type { RawExtractedMetadata } from "@/lib/types/normalization";
import { extractInstagramUsername } from "@/lib/services/csvValidationService";
import { runNormalizationPipeline } from "@/lib/services/normalizationPipeline";

export function csvRowToRaw(row: CsvMappedRow, sourceRecordId: string): RawExtractedMetadata {
  const instagram = row.instagram ? extractInstagramUsername(row.instagram) : null;

  return {
    source: "csv",
    sourceRecordId,
    displayName: row.name,
    username: instagram,
    bio: row.description,
    website: row.website ?? row.source_url,
    publicEmail: row.email,
    publicPhone: row.phone,
    profileUrl: row.source_url ?? row.website,
    businessCategory: row.category ?? row.type,
    country: row.country,
    city: row.city,
    state: row.state,
    area: row.area,
    address: row.address,
    latitude: row.lat,
    longitude: row.lng,
    verified: false,
  };
}

export async function normalizeCsvRow(row: CsvMappedRow, sourceRecordId: string) {
  return runNormalizationPipeline(csvRowToRaw(row, sourceRecordId));
}

export function previewNormalizedCsvRow(row: CsvMappedRow, sourceRecordId: string) {
  return csvRowToRaw(row, sourceRecordId);
}
