# Revit24 Data Studio — Architecture

Internal administration platform for discovering, collecting, organizing, classifying, reviewing, approving, and importing publicly available automotive community data into ShiftIt.

## Tech Stack

- **Next.js 15+** App Router
- **TypeScript** (strict)
- **Tailwind CSS** + **shadcn/ui**
- **Firebase Authentication** (architecture prepared)
- **Firestore** (import jobs & records persisted)
- **Vercel** deployment target

## Directory Structure

```
app/
  (auth)/          # Authentication routes
  (studio)/        # Main application shell routes
  api/             # Route handlers (import-jobs, review, queue API)

components/
  layout/          # App shell, sidebar, top nav
  dashboard/       # Dashboard-specific UI
  imports/         # Import Center components
  review/          # Admin Review Center components
  queue/           # Extraction queue & worker management components
  workers/         # Live worker runtime UI (Phase 9)
  entities/        # Normalized entity preview components (Phase 8)
  auth/            # Auth UI placeholders
  ui/              # shadcn/ui primitives

lib/
  firebase/        # Firebase initialization
  repositories/    # Firestore repository layer (no UI access)
  services/        # Business logic layer
  validation/      # Pure validation functions
  types/           # Shared TypeScript types
  errors/          # Centralized error handling
  mock-data/       # Mock fallback stores
  utils/           # Utilities
```

## Data Flow (Import Center)

```
UI Component
    ↓
API Route / Server Component
    ↓
Service Layer (importJobService)
    ↓
Repository Layer (importJobsRepository, importRecordsRepository)
    ↓
Firestore (import_jobs, import_records)
```

Validation (`lib/validation/instagramProfileInput.ts`) remains pure — no network calls.

## Phase 4 — Firestore Persistence

- Instagram bulk import jobs persisted to `import_jobs`
- Normalized profile records persisted to `import_records`
- Duplicate detection queries existing records by username
- Dashboard statistics loaded from Firestore when configured
- Application events logged to `logs` collection
- Mock Mode fallback when Firebase env vars are missing

## Phase 5 — Admin Review Center

Every imported record must pass individual admin review before ShiftIt can consume it. Nothing becomes live automatically.

### Routes

| Route | Purpose |
|-------|---------|
| `/review` | Review dashboard with summary cards, queue table, activity panel |
| `/review/[recordId]` | Record detail with moderation actions |
| `/review/duplicates` | Duplicate resolution center |
| `/review/approved` | Searchable approved records list |
| `/review/rejected` | Rejected records (reopenable) |

### Data Flow (Review Center)

```
Review UI (components/review/)
    ↓
API Route (app/api/review/[recordId])
    ↓
Service Layer (reviewService)
    ↓
Repositories (importRecords, approvedRecords, reviewHistory, appLogs)
    ↓
Firestore (import_records, approved_records, review_history, logs)
```

### Approval Lifecycle

1. Import creates `import_records` with `reviewStatus: pending_review` (valid rows)
2. Reviewer opens record in Review Center
3. Action (approve / reject / needs_edit / duplicate / merge_later) updates `import_records.reviewStatus`
4. Every action creates a `review_history` entry and logs to `logs`
5. On **approve**, a snapshot is copied to `approved_records` — original `import_record` is retained
6. ShiftIt will consume only `approved_records` (future phase)

### Review Record Statuses

`pending_review` · `approved` · `rejected` · `duplicate` · `needs_edit` · `merged`

Validation status (`valid` / `duplicate` / `invalid`) remains separate from review status.

### Role Permissions (Architecture Only)

| Role | Approve | Reject | Edit | Merge | Read-only |
|------|---------|--------|------|-------|-----------|
| Admin | ✓ | ✓ | ✓ | ✓ | |
| Reviewer | ✓ | ✓ | ✓ | | |
| Collector | | | | | ✓ |

Auth enforcement is deferred — `getDefaultReviewPermissions()` returns admin permissions for now.

## Phase 6 — Extraction Queue & Worker Management

Infrastructure for future extraction workers — think **GitHub Actions for data collection**. No extraction, scraping, or worker execution in this phase.

### Routes

| Route | Purpose |
|-------|---------|
| `/queue` | Queue dashboard with summary cards and job table |
| `/queue/[jobId]` | Job detail — progress, timeline, extraction records |
| `/queue/history` | Completed, failed, and cancelled jobs |
| `/workers` | Worker fleet overview (mock data) |
| `/workers/logs` | Searchable worker event logs |

### Data Flow (Extraction Queue)

```
Queue UI (components/queue/)
    ↓
API Route (app/api/queue/[jobId])
    ↓
Service Layer (queueService, workerService)
    ↓
Repositories (extractionJobs, extractionRecords, workerLogs)
    ↓
Firestore (extraction_jobs, extraction_records, worker_logs)
```

### Extraction Job Lifecycle (Architecture)

1. Approved import job generates an **Extraction Job** via `createExtractionJobFromImportJob()`
2. Valid import records become **Extraction Records** (waiting status)
3. Future workers poll the queue, claim jobs, and update progress
4. UI actions (queue, pause, resume, cancel, retry, priority) update status only — no execution
5. Worker logs stream to `worker_logs` collection (future)

### Job Status Values

`waiting` · `queued` · `running` · `paused` · `completed` · `failed` · `cancelled` · `retrying`

### Priority Levels

`low` · `normal` · `high` · `critical`

### Future Worker Lifecycle

```
Worker registers → sends heartbeat → polls for queued jobs
    → claims job → processes extraction records → updates progress
    → writes worker_logs → marks job completed/failed
```

Planned worker targets: Mac Studio, MacBook Pro, Ubuntu VPS, Windows Desktop.

### Progress Model

```typescript
progressPercent = Math.round((processedRecords / estimatedRecords) * 100)
```

Displayed via animated progress bars in queue table and detail views.

## Phase 7 — Instagram Public Profile Extraction Worker (MVP)

First extraction worker — processes **one public Instagram profile at a time** with manual and small-batch execution. Uses a generic `ProfileExtractionProvider` interface so Instagram, Google Places, TikTok, or other providers can be swapped without changing queue UI or services.

### Routes

| Route | Purpose |
|-------|---------|
| `/profiles/[username]` | Internal extraction quality review (not ShiftIt) |
| `POST /api/extraction/instagram` | Manual single profile or small batch test |
| `POST /api/queue/[jobId]/extract` | Run extraction worker against queue job records |

### Worker Architecture

```
workers/instagram/
  instagramProfileExtractor.ts   → ProfileExtractionProvider (fetch public HTML)
  instagramProfileParser.ts      → Parse og:meta + public JSON only
  instagramProfileWorker.ts        → Process one extraction record
  instagramWorkerRunner.ts         → Sequential batch runner
```

```
instagramExtractionService
    ↓
ProfileExtractionProvider (interface)
    ↓
InstagramProfileExtractor (default) — swappable with Playwright / Graph API later
    ↓
instagramProfilesRepository → instagram_profiles collection
```

### Extraction Lifecycle

1. Extraction job contains records with public profile URLs
2. Worker fetches public HTML (or mock mode via `INSTAGRAM_EXTRACTION_MODE=mock`)
3. Parser extracts only publicly visible metadata (og:tags, public counts, bio text)
4. Public email/phone extracted **only from bio text** if visibly written
5. Results saved to `instagram_profiles` — separate from approved ShiftIt records
6. Extraction record + job progress updated; events logged to `worker_logs`

### Public Metadata Collected

Username, display name, bio, profile URL, profile image, website, follower/following/post counts (if visible), verified badge, business category, public email/phone from bio only.

### Error Handling

`PROFILE_NOT_FOUND` · `PRIVATE_PROFILE` · `NETWORK_FAILURE` · `TIMEOUT` · `UNEXPECTED_HTML` · `PARSE_ERROR` — with retryable vs non-retryable classification.

## Phase 8 — Data Normalization & Enrichment Engine

Transforms raw extracted public metadata into structured automotive entities ready for admin review. **Deterministic rules only** — no AI, LLM, or automatic approvals in this phase.

### Routes

| Route | Purpose |
|-------|---------|
| `/entities` | Normalized entity list with summary cards and search |
| `/entities/[id]` | Entity preview — profile, brands, tags, matches, review status |
| `POST /api/normalization/run` | Trigger normalization for completed Instagram profiles |

### Data Flow (Normalization Pipeline)

```
Raw Extracted Metadata (instagram_profiles, future providers)
    ↓
normalizationPipeline.runNormalizationPipeline()
    ↓
Services: normalizationService · tagService · entityTypeService
          brandDetectionService · locationNormalizationService · confidenceService
    ↓
Repositories (normalizedRecords, entityMatches, normalizationLogs)
    ↓
Firestore (normalized_records, entity_matches, normalization_logs)
    ↓
Status: pending_review
```

### Normalized Record Model

Key fields: `source`, `sourceRecordId`, `entityType`, `displayName`, `username`, location fields, `tags`, `vehicleBrands`, `specialties`, `socialLinks`, `confidenceScore`, `status`, `workerVersion`.

Supported entity types: Club, Member, Shop, Detailer, Wrap Shop, Tint Shop, Wheel Shop, Performance Shop, Dyno Shop, Photographer, Videographer, Content Creator, Dealer, Track, Event Organizer, Car Event, Community Zone, Unknown.

### Confidence Scoring

Mock rule-based scoring (25–95) via `confidenceService.ts`:

- Base score 25, additive points for display name, username, bio, website, email, phone, location, brands, tags, known entity type, verified badge
- Labels: High (≥85), Medium (≥60), Low (≥40), Very Low (<40)

### Entity Matching (Duplicate Detection)

`entityMatchingService.ts` compares username, website, phone, public email, display name, city, and country across normalized records.

Output levels: **High Confidence**, **Medium**, **Low**, **Possible Match**, **No Match**.

**Detect only — no merge** performed. Matches stored in `entity_matches`.

### Tag Engine

Deterministic keyword matching in `tagService.ts` and `brandDetectionService.ts` for automotive brands (BMW, Mercedes, Porsche, etc.) and specialty tags (Drift, Track, Detailing, Wrap, etc.).

### Future AI Integration Points

| Service | Current | Future AI Replacement |
|---------|---------|----------------------|
| `entityTypeService` | Keyword rules | LLM classification with confidence |
| `tagService` | Keyword dictionary | Semantic tag extraction |
| `brandDetectionService` | Brand name matching | NER / brand ontology |
| `locationNormalizationService` | Bio text parsing | Geocoding + address parsing |
| `confidenceService` | Additive mock rules | ML confidence model |
| `entityMatchingService` | Field equality + fuzzy name | Embedding similarity |

All services accept structured inputs and return typed outputs — swap implementations without changing pipeline orchestration.

### Dashboard Integration

Main dashboard displays pipeline stats: Raw Imports, Extraction Jobs, Normalized Records, Pending Review, Approved.

## Phase 9 — Worker Runtime & Job Processing Engine

First phase with **real processing**. The worker runtime polls Firestore, claims queued extraction jobs atomically, processes records sequentially, updates progress, logs events, and triggers normalization after successful extraction.

### Routes & API

| Route | Purpose |
|-------|---------|
| `/workers` | Live worker fleet — heartbeats, current job, CPU/memory placeholders |
| `GET /api/workers` | List registered workers with live/offline status |
| `POST /api/workers/runtime/tick` | Run one poll → claim → execute cycle |
| `GET /api/queue/live` | Live queue progress for auto-refresh (10s polling) |

### Worker Runtime Architecture

```
workers/runtime/
  workerRuntime.ts          → Main loop (register → heartbeat → poll → execute)
  jobScheduler.ts           → Find claimable jobs by priority
  jobExecutor.ts            → Platform-agnostic job execution
  heartbeat.ts              → 30s heartbeat interval
  workerRegistration.ts     → Worker identity + platform detection
  shutdownHandler.ts        → Graceful SIGINT/SIGTERM shutdown
  extractionProviderRegistry.ts → Platform → provider mapping
  providers/instagramExtractionProvider.ts → Instagram implementation
```

```
Worker starts
  → registerWorkerInstance() → workers collection
  → heartbeat every 30s → lastHeartbeat, status, currentJob
  → claimNextQueuedJob() → Firestore transaction (queued/retrying → running)
  → executeExtractionJob() → ExtractionProvider (NOT Instagram-specific)
  → per record: extract → save profile → normalize → update progress → log
  → mark job completed → poll again
```

Run as standalone process: `npm run worker`

Configuration: `lib/config/runtime.ts` (polling interval, heartbeat, retry count, batch size, worker name/version).

### Worker Registration (`workers` collection)

Fields: `id`, `hostname`, `machineName`, `platform`, `version`, `status`, `startedAt`, `lastHeartbeat`, `currentJob`, `jobsCompleted`, `cpuUsagePercent`, `memoryUsagePercent`.

Workers considered offline when heartbeat expires (default 90s).

### Job Claim Flow

1. Worker polls for jobs with status `queued` or `retrying`
2. Jobs sorted by priority (critical → high → normal → low)
3. Firestore transaction atomically sets `status: running`, `claimedByWorkerId`, `claimedAt`
4. If another worker already claimed → transaction fails → skip
5. Only ONE worker processes a job at a time

### Processing Flow (per record)

```
Load next pending extraction_record
  → ExtractionProvider.executeJob() (Instagram provider for now)
  → Save to instagram_profiles
  → normalizeInstagramProfile() → normalized_records
  → Update job progress (processed, successful, failed, %)
  → Write worker_logs event
```

### Retry Logic

- Max attempts: configurable (default 3)
- Retry delay: configurable (default 5s)
- Retryable errors: `NETWORK_FAILURE`, `TIMEOUT`, `RATE_LIMITED`
- Permanent errors: `PROFILE_NOT_FOUND`, `PRIVATE_PROFILE`, `PARSE_ERROR`
- Record status: `retrying` between attempts

### ExtractionProvider Interface

Runtime never depends on Instagram directly. Platform providers implement `ExtractionProvider` in `lib/types/extraction-provider.ts`. Registry at `workers/runtime/extractionProviderRegistry.ts` — future: Google Places, TikTok, YouTube, Website.

## Mock Mode

When Firebase is not configured:

- In-memory store via `lib/mock-data/importJobStore.ts`, `reviewStore.ts`, `queueStore.ts`, and `normalizationStore.ts`
- Seeded demo data via `reviewSeedData.ts`, `queueSeedData.ts`, and `normalizationSeedData.ts` when empty
- UI displays **Mock Mode** badge and warning banner
- Application continues to function for development

## Out of Scope (Future Phases)

- Browser automation providers (Playwright, Puppeteer, Selenium) — swap via `ProfileExtractionProvider`
- Google Places / TikTok / website extractors (ExtractionProvider registry ready)
- AI classification (normalization services are AI-ready)
- Profile metadata extraction
- Chrome extension

## Roles

| Role      | Purpose                                      |
|-----------|----------------------------------------------|
| Admin     | Full platform access, approve/reject/merge   |
| Collector | Data discovery and import submission (read-only in Review Center) |
| Reviewer  | Record review, approval, and duplicate resolution |

Role permissions are defined in `lib/types/review.ts` (`REVIEW_ROLE_PERMISSIONS`).
