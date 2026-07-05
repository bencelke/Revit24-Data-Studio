# CSV Bulk Import

Phase 13 — CSV bulk import workflow for Revit24 Data Studio.

## Overview

Collectors upload CSV files containing automotive records (clubs, shops, events, websites, etc.). Records pass through column mapping, validation, duplicate detection, normalization, and the admin review pipeline. No automatic publishing.

## Routes

| Route | Purpose |
|-------|---------|
| `/imports/csv` | CSV import hub |
| `/imports/csv/new` | Upload, map, validate, and import wizard |
| `/imports/csv/[jobId]` | Job detail with record preview |
| `/imports/csv/history` | Past CSV import jobs |

## Recommended CSV Schema

| Column | Required | Description |
|--------|----------|-------------|
| `name` | Yes* | Business or entity display name |
| `type` | No | Entity type (Club, Shop, etc.) |
| `category` | No | Business category |
| `country` | No | Country |
| `state` | No | State or region |
| `city` | No | City |
| `area` | No | District or neighborhood |
| `address` | No | Street address |
| `lat` | No | Latitude (-90 to 90) |
| `lng` | No | Longitude (-180 to 180) |
| `instagram` | No | Instagram username or URL |
| `facebook` | No | Facebook URL |
| `tiktok` | No | TikTok URL |
| `youtube` | No | YouTube URL |
| `website` | No | Website URL |
| `email` | No | Public email address |
| `phone` | No | Public phone number |
| `description` | No | Bio or description |
| `tags` | No | Semicolon/comma-separated tags |
| `source_url` | Yes* | Primary source or profile URL |
| `status` | No | Record status hint |

\* At least one of `name` or `source_url` must be mapped.

Download the template from the import wizard using **Download Revit24 CSV Template**.

## Column Mapping

The mapping step auto-detects common column aliases:

- `business_name`, `display_name`, `title` → `name`
- `entity_type`, `business_type` → `type`
- `ig`, `instagram_username` → `instagram`
- `url`, `site`, `homepage` → `website`
- `profile_url`, `link` → `source_url`

Manual dropdown mapping is available for all target fields.

## Validation Rules

- **Required:** At least `name` or `source_url`
- **Email:** Valid email format
- **URLs:** Valid website and source_url format
- **Instagram:** Valid username or URL pattern
- **Coordinates:** lat ∈ [-90, 90], lng ∈ [-180, 180]
- **Phone:** Minimum 8 digits (warning if shorter)
- **Location:** Country or city recommended (warning if missing)
- **Type:** Recognized types preferred (warning for unknown)

## Duplicate Detection

CSV rows are compared against existing `normalized_records` and `approved_records` using:

- Instagram username
- Website URL
- Email
- Phone
- Name + City
- Coordinates (nearby)

Duplicates are **not blocked** — they are marked and sent to review with duplicate status.

## Import Lifecycle

```
1. Upload CSV (max 5 MB, 5,000 rows)
2. Auto-detect columns → manual mapping
3. Validate all rows
4. Preview valid / invalid / duplicate counts
5. Create csv_import_jobs + csv_import_records
6. Normalize valid rows → normalized_records
7. Create import_jobs + import_records → Review Center
8. Job status → completed
```

### Job Statuses

`draft` → `mapping` → `validating` → `ready` → `importing` → `completed` | `failed` | `cancelled`

### Record Validation Statuses

`valid` · `invalid` · `duplicate` · `warning`

## Firestore Collections

| Collection | Purpose |
|------------|---------|
| `csv_import_jobs` | CSV upload jobs with mapping and counts |
| `csv_import_records` | Per-row raw/mapped data and validation results |
| `import_jobs` | Review workflow jobs (created on import) |
| `import_records` | Review records (created on import) |
| `normalized_records` | Normalized entities from valid rows |
| `entity_matches` | Duplicate matches from normalization pipeline |

## Security

- CSV content is never executed — all values treated as plain text
- Formula injection prefixes (`=`, `+`, `-`, `@`) are sanitized on parse
- Values sanitized before display in preview tables

## Configuration

`lib/config/csv-import.ts`:

- `maxFileSizeBytes`: 5 MB
- `maxRows`: 5,000
- `previewRowLimit`: 10 (mapping sample)

## Services

| Service | Responsibility |
|---------|----------------|
| `csvParserService` | Parse CSV, sanitize cells, template generation |
| `csvMappingService` | Auto-detect mapping, apply field mapping |
| `csvValidationService` | Row validation, duplicate comparison |
| `csvNormalizationService` | `csvRowToRaw()` → normalization pipeline |
| `csvImportService` | Orchestration, job creation, review integration |
