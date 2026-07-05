export const CSV_IMPORT_CONFIG = {
  maxFileSizeBytes: 5 * 1024 * 1024,
  maxRows: 5000,
  previewRowLimit: 10,
} as const;

export const CSV_TEMPLATE_HEADERS: readonly string[] = [
  "name",
  "type",
  "category",
  "country",
  "state",
  "city",
  "area",
  "address",
  "lat",
  "lng",
  "instagram",
  "facebook",
  "tiktok",
  "youtube",
  "website",
  "email",
  "phone",
  "description",
  "tags",
  "source_url",
  "status",
] as const;
