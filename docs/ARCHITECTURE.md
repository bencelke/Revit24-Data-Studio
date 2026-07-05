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

## Mock Mode

When Firebase is not configured:

- In-memory store via `lib/mock-data/importJobStore.ts`, `reviewStore.ts`, and `queueStore.ts`
- Seeded demo data via `reviewSeedData.ts` and `queueSeedData.ts` when empty
- UI displays **Mock Mode** badge and warning banner
- Application continues to function for development

## Out of Scope (Future Phases)

- Browser automation providers (Playwright, Puppeteer, Selenium) — swap via `ProfileExtractionProvider`
- Background worker daemons and OS schedulers
- Google Places / TikTok / website extractors (interface ready)
- AI classification
- Profile metadata extraction
- Chrome extension

## Roles

| Role      | Purpose                                      |
|-----------|----------------------------------------------|
| Admin     | Full platform access, approve/reject/merge   |
| Collector | Data discovery and import submission (read-only in Review Center) |
| Reviewer  | Record review, approval, and duplicate resolution |

Role permissions are defined in `lib/types/review.ts` (`REVIEW_ROLE_PERMISSIONS`).
