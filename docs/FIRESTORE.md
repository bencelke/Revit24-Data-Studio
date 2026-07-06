# Firestore Data Model

Revit24 Data Studio uses Firestore for import job persistence with a repository/service architecture.

## Active Collections

| Collection         | Purpose                                              |
|--------------------|------------------------------------------------------|
| `import_jobs`      | Import job documents (Instagram bulk imports, etc.)  |
| `import_records`   | Normalized profile links/usernames per job           |
| `approved_records` | Approved snapshots ready for ShiftIt (Phase 5)       |
| `review_history`   | Moderation audit trail per import record (Phase 5)   |
| `extraction_jobs`  | Extraction queue jobs from approved imports (Phase 6) |
| `extraction_records` | Per-profile extraction tasks within a job (Phase 6)  |
| `worker_logs`      | Extraction worker event logs (Phase 6)               |
| `workers`          | Registered worker fleet with heartbeats (Phase 9)    |
| `instagram_profiles` | Extracted public profile metadata (Phase 7)        |
| `google_places_raw` | Raw Google Places discovery records (Phase 10)       |
| `saved_searches`   | Saved Google Places search templates (Phase 10)      |
| `places_search_jobs` | Google Places search execution jobs (Phase 10)     |
| `website_jobs`       | Website discovery execution jobs (Phase 11)          |
| `website_raw`        | Raw public website metadata records (Phase 11)       |
| `csv_import_jobs`      | CSV bulk import jobs (Phase 13)                      |
| `csv_import_records`   | Per-row CSV import records (Phase 13)                |
| `normalized_records` | Structured automotive entities (Phase 8)           |
| `entity_matches`     | Duplicate detection and resolution (Phase 8/12)      |
| `merge_history`      | Merge resolution audit trail (Phase 12)              |
| `normalization_logs` | Normalization pipeline audit trail (Phase 8)       |
| `pipeline_jobs`      | Unified import pipeline jobs (Phase 14)            |
| `pipeline_events`    | Pipeline stage event audit trail (Phase 14)        |
| `publish_queue`      | Approved records for public app (Phase 14)         |
| `discovery_campaigns`| Discovery search campaigns (Phase 16)              |
| `discovery_jobs`     | Discovery campaign execution jobs (Phase 16)       |
| `discovery_templates`| Reusable discovery templates (Phase 16)            |
| `discovery_results`  | Standardized discovery results (Phase 16)          |
| `logs`             | Application audit logs                               |

## Planned Collections

| Collection   | Purpose                                      |
|--------------|----------------------------------------------|
| `imports`    | Legacy raw import batches                    |
| `profiles`   | Instagram and social profile records         |
| `businesses` | Google Places and business listings          |
| `events`     | Car events and community gatherings          |
| `users`      | Platform users with role assignments         |
| `jobs`       | Background job queue and processing state    |

## import_jobs Document

| Field              | Type     | Description                    |
|--------------------|----------|--------------------------------|
| `id`               | string   | Document ID                    |
| `name`             | string   | Job display name               |
| `type`             | string   | e.g. `instagram_profile_links` |
| `source`           | string   | e.g. `instagram`               |
| `status`           | string   | See status values below        |
| `createdBy`        | string   | User ID (currently `system-dev`) |
| `createdAt`        | timestamp| Creation time                  |
| `updatedAt`        | timestamp| Last update time               |
| `totalRecords`     | number   | Total input lines              |
| `validRecords`     | number   | Valid profiles                 |
| `duplicateRecords` | number   | Duplicate profiles             |
| `invalidRecords`   | number   | Invalid input rows             |
| `notes`            | string?  | Optional notes                 |
| `metadata`         | object?  | Extensible metadata            |

### Job Status Values

`draft` · `queued` · `running` · `completed` · `failed` · `cancelled` · `pending_review`

## import_records Document

| Field           | Type     | Description                         |
|-----------------|----------|-------------------------------------|
| `id`            | string   | Document ID                         |
| `jobId`         | string   | Parent import job ID                |
| `originalInput` | string   | Raw pasted value                    |
| `username`      | string?  | Normalized Instagram username       |
| `profileUrl`    | string?  | Normalized profile URL              |
| `status`        | string   | `valid` · `duplicate` · `invalid`   |
| `error`         | string?  | Validation error message            |
| `duplicateOf`   | string?  | Existing record ID if duplicate     |
| `reviewStatus`  | string   | Review workflow status (Phase 5)    |
| `displayName`   | string?  | Editable display name               |
| `importSource`  | string   | e.g. `instagram`                    |
| `reviewer`      | string?  | Last reviewer user ID               |
| `website`       | string?  | Public website                      |
| `publicEmail`   | string?  | Public contact email                |
| `tags`          | string[] | Tags                                |
| `country`       | string?  | Country                             |
| `city`          | string?  | City                                |
| `description`   | string?  | Description                         |
| `createdAt`     | timestamp| Creation time                       |
| `updatedAt`     | timestamp| Last update time                    |

### Review Status Values

`pending_review` · `approved` · `rejected` · `duplicate` · `needs_edit` · `merged`

## approved_records Document

| Field            | Type      | Description                          |
|------------------|-----------|--------------------------------------|
| `id`             | string    | Document ID                          |
| `importRecordId` | string    | Source import record ID              |
| `jobId`          | string    | Parent import job ID                 |
| `username`       | string?   | Approved username                    |
| `profileUrl`     | string?   | Profile URL                          |
| `displayName`    | string?   | Display name                         |
| `importSource`   | string    | Import source                        |
| `website`        | string?   | Website                              |
| `publicEmail`    | string?   | Public email                         |
| `tags`           | string[]  | Tags                                 |
| `country`        | string?   | Country                              |
| `city`           | string?   | City                                 |
| `description`    | string?   | Description                          |
| `approvedBy`     | string    | Reviewer who approved                |
| `approvedAt`     | timestamp | Approval timestamp                   |
| `metadata`       | object?   | Extensible metadata                  |

## review_history Document

| Field            | Type      | Description                          |
|------------------|-----------|--------------------------------------|
| `id`             | string    | Document ID                          |
| `recordId`       | string    | Import record ID                     |
| `previousStatus` | string    | Status before action                 |
| `newStatus`      | string    | Status after action                  |
| `reviewer`       | string    | Reviewer user ID                     |
| `timestamp`      | timestamp | Action timestamp                     |
| `reason`         | string?   | Action reason / type                 |
| `notes`          | string?   | Reviewer notes                       |

## extraction_jobs Document

| Field              | Type      | Description                          |
|--------------------|-----------|--------------------------------------|
| `id`               | string    | Document ID                          |
| `importJobId`      | string    | Source import job ID                 |
| `name`             | string    | Job display name                     |
| `platform`         | string    | e.g. `instagram`                     |
| `status`           | string    | See extraction status values         |
| `priority`         | string    | `low` · `normal` · `high` · `critical` |
| `createdBy`        | string    | User ID                              |
| `createdAt`        | timestamp | Creation time                        |
| `startedAt`        | timestamp?| When worker started                  |
| `completedAt`      | timestamp?| When job finished                    |
| `estimatedRecords` | number    | Total records to process             |
| `processedRecords` | number    | Records processed so far             |
| `successfulRecords`| number    | Successful extractions               |
| `failedRecords`    | number    | Failed extractions                   |
| `duplicateRecords` | number    | Duplicate detections                 |
| `workerVersion`    | string?   | Worker semver                        |
| `notes`            | string?   | Optional notes                       |

### Extraction Job Status Values

`waiting` · `queued` · `running` · `paused` · `completed` · `failed` · `cancelled` · `retrying`

## extraction_records Document

| Field            | Type      | Description                          |
|------------------|-----------|--------------------------------------|
| `id`             | string    | Document ID                          |
| `jobId`          | string    | Parent extraction job ID             |
| `importRecordId` | string    | Source import record ID              |
| `username`       | string?   | Profile username                     |
| `profileUrl`     | string?   | Profile URL                          |
| `status`         | string    | Record processing status             |
| `attempts`       | number    | Retry attempt count                  |
| `startedAt`      | timestamp?| Processing start                     |
| `completedAt`    | timestamp?| Processing end                       |
| `lastError`      | string?   | Last error message                   |
| `workerId`       | string?   | Assigned worker ID                   |

## worker_logs Document

| Field        | Type      | Description                          |
|--------------|-----------|--------------------------------------|
| `id`         | string    | Document ID                          |
| `timestamp`  | timestamp | Log timestamp                        |
| `workerId`   | string    | Worker identifier                    |
| `workerName` | string    | Worker display name                  |
| `level`      | string    | `debug` · `info` · `warning` · `error` |
| `event`      | string    | Event type                           |
| `jobId`      | string?   | Related extraction job ID            |
| `message`    | string    | Log message                          |

## instagram_profiles Document

| Field                  | Type      | Description                          |
|------------------------|-----------|--------------------------------------|
| `id`                   | string    | Document ID                          |
| `username`             | string    | Instagram username                   |
| `displayName`          | string?   | Public display name                  |
| `bio`                  | string?   | Public bio text                      |
| `profileImageUrl`      | string?   | Public profile image URL             |
| `profileUrl`           | string    | Normalized profile URL               |
| `website`              | string?   | External website link                |
| `publicEmail`          | string?   | Email visible in bio only            |
| `publicPhone`          | string?   | Phone visible in bio only            |
| `followers`            | number?   | Follower count if publicly visible   |
| `following`            | number?   | Following count if publicly visible  |
| `posts`                | number?   | Post count if publicly visible       |
| `verified`             | boolean   | Verified badge                       |
| `businessCategory`     | string?   | Business category if visible         |
| `extractedAt`          | timestamp | Extraction timestamp                 |
| `extractionDurationMs` | number    | Extraction duration in ms            |
| `workerVersion`        | string    | Worker semver                        |
| `status`               | string    | `pending` · `completed` · `failed` · `private` · `not_found` |
| `errorCode`            | string?   | Error code if failed                 |
| `errorMessage`         | string?   | Error message if failed              |
| `extractionJobId`      | string?   | Source extraction job                |
| `extractionRecordId`   | string?   | Source extraction record             |
| `importRecordId`       | string?   | Source import record                 |
| `rawJson`              | object?   | Optional raw parse payload           |

## Repository Layer

| Repository                    | File                                      |
|-------------------------------|-------------------------------------------|
| Import jobs                   | `lib/repositories/importJobsRepository.ts` |
| Import records                | `lib/repositories/importRecordsRepository.ts` |
| Approved records              | `lib/repositories/approvedRecordsRepository.ts` |
| Review history                | `lib/repositories/reviewHistoryRepository.ts` |
| Extraction jobs               | `lib/repositories/extractionJobsRepository.ts` |
| Extraction records            | `lib/repositories/extractionRecordsRepository.ts` |
| Worker logs                   | `lib/repositories/workerLogsRepository.ts` |
| Instagram profiles            | `lib/repositories/instagramProfilesRepository.ts` |
| Normalized records            | `lib/repositories/normalizedRecordsRepository.ts` |
| Entity matches                | `lib/repositories/entityMatchesRepository.ts` |
| Normalization logs            | `lib/repositories/normalizationLogsRepository.ts` |
| Application logs              | `lib/repositories/appLogsRepository.ts`   |

All Firestore access is isolated in repositories. UI and components never call Firestore directly.

## Service Layer

| Service | File | Responsibilities |
|---------|------|------------------|
| Import jobs | `lib/services/importJobService.ts` | Bulk input, duplicate detection, job/record creation |
| Review | `lib/services/reviewService.ts` | Approve, reject, needs edit, history, approved record copy, logging |
| Queue | `lib/services/queueService.ts` | Extraction job creation, progress, status updates, mock execution |
| Workers | `lib/services/workerService.ts` | Worker fleet data, worker log filtering |
| Instagram extraction | `lib/services/instagramExtractionService.ts` | Run worker, save profiles, update queue progress |
| Normalization pipeline | `lib/services/normalizationPipeline.ts` | Orchestrate normalize → match → log |
| Normalization | `lib/services/normalizationService.ts` | Field normalization (name, email, phone, social) |
| Tags | `lib/services/tagService.ts` | Deterministic automotive tag detection |
| Entity type | `lib/services/entityTypeService.ts` | Rule-based entity classification |
| Brand detection | `lib/services/brandDetectionService.ts` | Vehicle brand and specialty detection |
| Location | `lib/services/locationNormalizationService.ts` | Location parsing from bio text |
| Confidence | `lib/services/confidenceService.ts` | Mock confidence scoring (25–95) |
| Entity matching | `lib/services/entityMatchingService.ts` | Duplicate detection (no merge) |

## normalized_records Document (Phase 8)

| Field            | Type     | Description                              |
|------------------|----------|------------------------------------------|
| `id`             | string   | Document ID                              |
| `source`         | string   | e.g. `instagram`, `google_places`        |
| `sourceRecordId` | string   | ID of raw extracted record               |
| `entityType`     | string   | Club, Shop, Detailer, Unknown, etc.      |
| `displayName`    | string   | Normalized display name                  |
| `username`       | string?  | Normalized username                      |
| `website`        | string?  | Normalized website URL                   |
| `publicEmail`    | string?  | Normalized public email                  |
| `publicPhone`    | string?  | Normalized phone                         |
| `country`        | string?  | Country                                  |
| `state`          | string?  | State/region                             |
| `city`           | string?  | City                                     |
| `area`           | string?  | Area/neighborhood                        |
| `address`        | string?  | Street address                           |
| `latitude`       | number?  | Latitude                                 |
| `longitude`      | number?  | Longitude                                |
| `description`    | string?  | Bio/description text                     |
| `tags`           | string[] | Automotive tags                          |
| `vehicleBrands`  | string[] | Detected vehicle brands                  |
| `specialties`    | string[] | Detected specialties                     |
| `socialLinks`    | object   | Instagram, Facebook, TikTok, etc.        |
| `status`         | string   | `pending_review` · `approved` · etc.     |
| `confidenceScore`| number   | 25–95 mock confidence score              |
| `normalizedAt`   | string   | ISO timestamp                            |
| `workerVersion`  | string   | Normalization engine version             |

## entity_matches Document (Phase 8/12)

| Field               | Type     | Description                         |
|---------------------|----------|-------------------------------------|
| `recordAId`         | string   | First normalized record ID          |
| `recordBId`         | string   | Second normalized record ID         |
| `matchType`         | string   | automatic · manual                  |
| `confidence`        | string   | high · medium · low · possible      |
| `confidenceScore`   | number   | Match confidence score              |
| `status`            | string   | pending · resolved · ignored · needs_review |
| `reasons`           | string[] | Match reason codes                  |
| `resolution`        | string?  | merge · keep_separate · mark_duplicate · approve_both |
| `resolvedBy`        | string?  | Reviewer who resolved the match     |
| `resolvedAt`        | timestamp? | When match was resolved           |
| `notes`             | string?  | Resolution notes                    |
| `createdAt`         | timestamp| When match was detected             |
| `updatedAt`         | timestamp| Last update timestamp               |

Legacy fields (`normalizedRecordId`, `matchedRecordId`, `matchFields`, `confidenceLevel`) are written for backward compatibility.

## merge_history Document (Phase 12)

| Field            | Type     | Description                              |
|------------------|----------|------------------------------------------|
| `matchId`        | string   | Related entity_matches document ID       |
| `recordAId`      | string   | Record A at time of action               |
| `recordBId`      | string   | Record B at time of action               |
| `action`         | string   | merge · mark_duplicate · keep_separate · ignore_match · approve_both · needs_review |
| `performedBy`    | string   | Reviewer who performed the action        |
| `performedAt`    | timestamp| When action was performed                |
| `notes`          | string?  | Optional resolution notes                |
| `fieldSelections`| object?  | Field merge selections (for merge action)  |
| `resultRecordId` | string?  | Canonical record ID after merge          |

## Mock Mode

When Firebase environment variables are missing, the app automatically uses in-memory mock storage (`importJobStore`, `reviewStore`, `queueStore`, `workerStore`, `normalizationStore`) and displays a **Mock Mode** badge. Demo data is seeded via `reviewSeedData.ts`, `queueSeedData.ts`, and `normalizationSeedData.ts`.

## Environment Variables

See `.env.example` for required Firebase configuration.
