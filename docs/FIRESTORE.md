# Firestore Data Model

Revit24 Data Studio uses Firestore for import job persistence with a repository/service architecture.

## Active Collections (Phase 4)

| Collection        | Purpose                                              |
|-------------------|------------------------------------------------------|
| `import_jobs`     | Import job documents (Instagram bulk imports, etc.)  |
| `import_records`  | Normalized profile links/usernames per job           |
| `logs`            | Application audit logs                               |

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
| `createdAt`     | timestamp| Creation time                       |
| `updatedAt`     | timestamp| Last update time                    |

## Repository Layer

| Repository                    | File                                      |
|-------------------------------|-------------------------------------------|
| Import jobs                   | `lib/repositories/importJobsRepository.ts` |
| Import records                | `lib/repositories/importRecordsRepository.ts` |
| Application logs              | `lib/repositories/appLogsRepository.ts`   |

All Firestore access is isolated in repositories. UI and components never call Firestore directly.

## Service Layer

`lib/services/importJobService.ts` handles:

- Bulk input validation orchestration
- Duplicate detection against existing records
- Job and record creation
- History and dashboard statistics
- Mock fallback when Firebase is not configured

## Mock Mode

When Firebase environment variables are missing, the app automatically uses in-memory mock storage (`lib/mock-data/importJobStore.ts`) and displays a **Mock Mode** badge.

## Environment Variables

See `.env.example` for required Firebase configuration.
