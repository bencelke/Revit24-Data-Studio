# Firestore Data Model

Revit24 Data Studio uses Firestore for import job persistence with a repository/service architecture.

## Active Collections

| Collection         | Purpose                                              |
|--------------------|------------------------------------------------------|
| `import_jobs`      | Import job documents (Instagram bulk imports, etc.)  |
| `import_records`   | Normalized profile links/usernames per job           |
| `approved_records` | Approved snapshots ready for ShiftIt (Phase 5)       |
| `review_history`   | Moderation audit trail per import record (Phase 5)   |
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

## Repository Layer

| Repository                    | File                                      |
|-------------------------------|-------------------------------------------|
| Import jobs                   | `lib/repositories/importJobsRepository.ts` |
| Import records                | `lib/repositories/importRecordsRepository.ts` |
| Approved records              | `lib/repositories/approvedRecordsRepository.ts` |
| Review history                | `lib/repositories/reviewHistoryRepository.ts` |
| Application logs              | `lib/repositories/appLogsRepository.ts`   |

All Firestore access is isolated in repositories. UI and components never call Firestore directly.

## Service Layer

| Service | File | Responsibilities |
|---------|------|------------------|
| Import jobs | `lib/services/importJobService.ts` | Bulk input, duplicate detection, job/record creation |
| Review | `lib/services/reviewService.ts` | Approve, reject, needs edit, history, approved record copy, logging |

## Mock Mode

When Firebase environment variables are missing, the app automatically uses in-memory mock storage (`lib/mock-data/importJobStore.ts`, `lib/mock-data/reviewStore.ts`) and displays a **Mock Mode** badge. Demo review data is seeded via `lib/mock-data/reviewSeedData.ts`.

## Environment Variables

See `.env.example` for required Firebase configuration.
