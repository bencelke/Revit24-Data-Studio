# Unified Import Pipeline

Phase 14 connects every import module into one automated end-to-end pipeline. All providers follow the same lifecycle — nothing skips a stage.

## Flow

```
Create Import Job
      ↓
Queue Records
      ↓
Worker Processes Records
      ↓
Raw Metadata
      ↓
Normalization
      ↓
Duplicate Detection
      ↓
Review Queue
      ↓
Admin Approval
      ↓
Publish Queue
```

The public Revit24 application will consume the publish queue in a future phase. Records are **not** published directly from Data Studio.

## Pipeline Stages

| Stage | Status | Description |
|-------|--------|-------------|
| Import | `created` | Import job created for a provider |
| Queue | `queued` | Records queued for worker or inline processing |
| Extraction | `extracting` / `extracted` | Worker or provider extracts raw metadata |
| Normalization | `normalizing` / `normalized` | Entity normalization pipeline |
| Duplicate Detection | `matching` | Entity match and merge center |
| Review | `review` / `approved` / `rejected` | Admin review center |
| Publish | `ready_to_publish` / `published` | Approved records placed in publish queue |

## Pipeline Statuses

`created` · `queued` · `extracting` · `extracted` · `normalizing` · `normalized` · `matching` · `review` · `approved` · `rejected` · `ready_to_publish` · `published` · `failed`

## Provider Lifecycle

Every provider implements the `ImportProvider` interface:

| Method | Stage |
|--------|-------|
| `validate()` | Import |
| `prepare()` | Queue |
| `extract()` | Extraction |
| `normalize()` | Normalization |
| `detectDuplicates()` | Duplicate Detection |
| `sendToReview()` | Review |
| `publish()` | Publish |

Registered providers: Instagram, Google Places, Website, CSV, API, Manual.

Provider implementations delegate to existing services — Phase 14 adds orchestration, not new scraping.

## Firestore Collections

### `pipeline_jobs`

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Document ID |
| `provider` | string | `instagram`, `google_places`, `website`, `csv`, `api`, `manual` |
| `status` | string | Current pipeline status |
| `currentStage` | string | Active stage |
| `progress` | number | 0–100 completion |
| `totalRecords` | number | Records in job |
| `processedRecords` | number | Records processed so far |
| `successfulRecords` | number | Successful count |
| `failedRecords` | number | Failed count |
| `createdBy` | string | User or system |
| `createdAt` | timestamp | Job creation |
| `updatedAt` | timestamp | Last update |
| `completedAt` | timestamp \| null | Completion time |
| `importJobId` | string \| null | Linked import job |
| `extractionJobId` | string \| null | Linked extraction job |
| `sourceJobId` | string \| null | Source-specific job ID |
| `stageProgress` | array | Per-stage status, duration, records, errors |
| `metadata` | object \| null | Provider-specific metadata |

### `pipeline_events`

Append-only audit trail per job.

| Field | Type |
|-------|------|
| `timestamp` | timestamp |
| `jobId` | string |
| `recordId` | string \| null |
| `stage` | string |
| `status` | string |
| `message` | string |
| `duration` | number \| null |
| `worker` | string \| null |

### `publish_queue`

Approved records awaiting consumption by the public Revit24 app.

| Field | Type |
|-------|------|
| `importRecordId` | string |
| `approvedRecordId` | string \| null |
| `pipelineJobId` | string \| null |
| `provider` | string |
| `status` | `pending` \| `ready` \| `published` \| `failed` |
| `displayName` | string \| null |
| `importSource` | string |
| `createdAt` | timestamp |
| `publishedAt` | timestamp \| null |
| `metadata` | object \| null |

## Services

| Service | Responsibility |
|---------|----------------|
| `pipelineEngine.ts` | Provider registry, stage execution, orchestration |
| `pipelineService.ts` | Job CRUD, dashboard data, stage advancement |
| `pipelineStatusService.ts` | Status/stage mapping, progress calculation |
| `pipelineEventService.ts` | Event logging and retrieval |
| `pipelineMetricsService.ts` | Dashboard metrics (duration, rates, throughput) |
| `publishQueueService.ts` | Enqueue approved records, publish status |
| `pipelineIntegrationService.ts` | Hooks into existing import flows |

## UI Routes

| Route | Purpose |
|-------|---------|
| `/pipeline` | Dashboard — running, queued, review, publish, failed |
| `/pipeline/[jobId]` | Visualizer, timeline, events, progress |

## Integration Points

Pipeline jobs are created when imports start:

- Instagram → `importJobService`
- Google Places → `placesImportService`
- Website → `websiteImportService`
- CSV → `csvImportService`

On admin approval, `reviewService` enqueues records to `publish_queue` via `publishQueueService.enqueueFromApproval()`.

Existing modules are not refactored — Phase 14 is an additive orchestration layer.
