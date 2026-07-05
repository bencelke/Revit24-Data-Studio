import type { CsvFieldMapping, CsvMappedRow, CsvTargetField } from "@/lib/types/csv-import";
import { CSV_TARGET_FIELDS } from "@/lib/types/csv-import";

const AUTO_DETECT_ALIASES: Record<CsvTargetField, string[]> = {
  name: ["name", "business_name", "business name", "display_name", "title", "company"],
  type: ["type", "entity_type", "entity type", "business_type"],
  category: ["category", "business_category", "industry"],
  country: ["country", "nation"],
  state: ["state", "region", "province"],
  city: ["city", "town", "locality"],
  area: ["area", "district", "neighborhood", "neighbourhood"],
  address: ["address", "street", "street_address", "full_address"],
  lat: ["lat", "latitude"],
  lng: ["lng", "lon", "long", "longitude"],
  instagram: ["instagram", "ig", "instagram_username", "instagram_url"],
  facebook: ["facebook", "fb", "facebook_url"],
  tiktok: ["tiktok", "tiktok_url"],
  youtube: ["youtube", "youtube_url", "yt"],
  website: ["website", "url", "site", "web", "homepage"],
  email: ["email", "e-mail", "public_email", "contact_email"],
  phone: ["phone", "telephone", "mobile", "public_phone", "contact_phone"],
  description: ["description", "bio", "about", "notes", "summary"],
  tags: ["tags", "labels", "keywords"],
  source_url: ["source_url", "source url", "profile_url", "profile url", "link"],
  status: ["status", "record_status"],
};

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, "_");
}

export function autoDetectFieldMapping(headers: string[]): CsvFieldMapping {
  const normalizedHeaders = headers.map(normalizeHeader);
  const mapping: CsvFieldMapping = {};

  for (const field of CSV_TARGET_FIELDS) {
    const aliases = AUTO_DETECT_ALIASES[field];
    const matchIndex = normalizedHeaders.findIndex((header) =>
      aliases.some((alias) => header === alias.replace(/\s+/g, "_") || header.includes(alias.replace(/\s+/g, "_"))),
    );
    if (matchIndex >= 0) {
      mapping[field] = headers[matchIndex];
    }
  }

  return mapping;
}

function getMappedValue(row: Record<string, string>, mapping: CsvFieldMapping, field: CsvTargetField): string | null {
  const sourceColumn = mapping[field];
  if (!sourceColumn) return null;
  const value = row[sourceColumn]?.trim() ?? row[normalizeHeader(sourceColumn)]?.trim();
  return value || null;
}

function parseTags(value: string | null): string[] {
  if (!value) return [];
  return value.split(/[;,|]/).map((tag) => tag.trim()).filter(Boolean);
}

function parseCoordinate(value: string | null): number | null {
  if (!value) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export function applyFieldMapping(
  row: Record<string, string>,
  mapping: CsvFieldMapping,
): CsvMappedRow {
  return {
    name: getMappedValue(row, mapping, "name"),
    type: getMappedValue(row, mapping, "type"),
    category: getMappedValue(row, mapping, "category"),
    country: getMappedValue(row, mapping, "country"),
    state: getMappedValue(row, mapping, "state"),
    city: getMappedValue(row, mapping, "city"),
    area: getMappedValue(row, mapping, "area"),
    address: getMappedValue(row, mapping, "address"),
    lat: parseCoordinate(getMappedValue(row, mapping, "lat")),
    lng: parseCoordinate(getMappedValue(row, mapping, "lng")),
    instagram: getMappedValue(row, mapping, "instagram"),
    facebook: getMappedValue(row, mapping, "facebook"),
    tiktok: getMappedValue(row, mapping, "tiktok"),
    youtube: getMappedValue(row, mapping, "youtube"),
    website: getMappedValue(row, mapping, "website"),
    email: getMappedValue(row, mapping, "email"),
    phone: getMappedValue(row, mapping, "phone"),
    description: getMappedValue(row, mapping, "description"),
    tags: parseTags(getMappedValue(row, mapping, "tags")),
    source_url: getMappedValue(row, mapping, "source_url"),
    status: getMappedValue(row, mapping, "status"),
  };
}

export function getRequiredFields(): CsvTargetField[] {
  return ["name", "source_url"];
}

export function isMappingComplete(mapping: CsvFieldMapping): boolean {
  return Boolean(mapping.name || mapping.source_url);
}

export function getFieldRequirementLabel(field: CsvTargetField): "required" | "optional" {
  if (field === "name" || field === "source_url") return "required";
  return "optional";
}

export const REQUIRED_FIELD_NOTE = "At least one of name or source_url must be mapped.";
