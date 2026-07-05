import type { CsvDuplicateMatch, CsvMappedRow, CsvValidationStatus } from "@/lib/types/csv-import";
import { mapFieldsToReasons } from "@/lib/services/matchScoringService";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_REGEX = /^https?:\/\/.+/i;
const INSTAGRAM_REGEX = /^(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9._]+)|^@?([a-zA-Z0-9._]+)$/i;

const VALID_TYPES = [
  "club", "member", "shop", "detailer", "wrap shop", "performance shop",
  "dealer", "track", "event", "photographer", "blog", "organization",
];

export interface CsvRowValidationResult {
  validationStatus: CsvValidationStatus;
  errors: string[];
  warnings: string[];
}

function normalize(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function extractInstagramUsername(value: string): string | null {
  const match = value.match(INSTAGRAM_REGEX);
  if (!match) return null;
  return (match[1] ?? match[2] ?? "").replace(/^@/, "").toLowerCase();
}

export function validateCsvRow(row: CsvMappedRow): CsvRowValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!row.name && !row.source_url) {
    errors.push("Required: name or source_url must be provided.");
  }

  if (row.type && !VALID_TYPES.some((type) => row.type!.toLowerCase().includes(type))) {
    warnings.push(`Unrecognized type "${row.type}" — will default during normalization.`);
  }

  if (row.email && !EMAIL_REGEX.test(row.email)) {
    errors.push("Invalid email format.");
  }

  if (row.website && !URL_REGEX.test(row.website) && !row.website.includes(".")) {
    errors.push("Invalid website URL format.");
  }

  if (row.source_url && !URL_REGEX.test(row.source_url) && !row.source_url.includes(".")) {
    errors.push("Invalid source_url format.");
  }

  if (row.instagram && !extractInstagramUsername(row.instagram)) {
    errors.push("Invalid Instagram username or URL.");
  }

  if (row.lat != null && (row.lat < -90 || row.lat > 90)) {
    errors.push("Latitude must be between -90 and 90.");
  }
  if (row.lng != null && (row.lng < -180 || row.lng > 180)) {
    errors.push("Longitude must be between -180 and 180.");
  }

  if (row.phone && row.phone.replace(/\D/g, "").length < 8) {
    warnings.push("Phone number may be incomplete.");
  }

  if (!row.country && !row.city) {
    warnings.push("Country or city is recommended for better matching.");
  }

  let validationStatus: CsvValidationStatus = "valid";
  if (errors.length > 0) validationStatus = "invalid";
  else if (warnings.length > 0) validationStatus = "warning";

  return { validationStatus, errors, warnings };
}

export function compareCsvRowToRecord(
  row: CsvMappedRow,
  record: {
    id: string;
    displayName: string;
    username: string | null;
    website: string | null;
    publicEmail: string | null;
    publicPhone: string | null;
    city: string | null;
    latitude: number | null;
    longitude: number | null;
  },
): CsvDuplicateMatch | null {
  const fields: string[] = [];
  let score = 0;

  const rowInstagram = row.instagram ? extractInstagramUsername(row.instagram) : null;
  if (rowInstagram && normalize(record.username) === rowInstagram) {
    fields.push("instagram");
    score += 40;
  }
  if (row.website && normalize(row.website) === normalize(record.website)) {
    fields.push("website");
    score += 35;
  }
  if (row.email && normalize(row.email) === normalize(record.publicEmail)) {
    fields.push("email");
    score += 25;
  }
  if (row.phone && normalize(row.phone) === normalize(record.publicPhone)) {
    fields.push("phone");
    score += 25;
  }
  if (row.name && normalize(row.name) === normalize(record.displayName) && row.city && normalize(row.city) === normalize(record.city)) {
    fields.push("name");
    fields.push("city");
    score += 20;
  }
  if (
    row.lat != null && row.lng != null &&
    record.latitude != null && record.longitude != null
  ) {
    const latDiff = Math.abs(row.lat - record.latitude);
    const lngDiff = Math.abs(row.lng - record.longitude);
    if (latDiff < 0.0005 && lngDiff < 0.0005) {
      fields.push("coordinates");
      score += 20;
    }
  }

  if (fields.length === 0 || score < 25) return null;

  return {
    matchedId: record.id,
    matchedName: record.displayName,
    matchFields: fields,
    confidenceScore: Math.min(100, score),
    reasons: mapFieldsToReasons(fields),
  };
}

export { extractInstagramUsername };
