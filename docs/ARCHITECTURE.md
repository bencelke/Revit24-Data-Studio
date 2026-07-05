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
  api/             # Route handlers (import-jobs, review API)

components/
  layout/          # App shell, sidebar, top nav
  dashboard/       # Dashboard-specific UI
  imports/         # Import Center components
  review/          # Admin Review Center components
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

## Mock Mode

When Firebase is not configured:

- In-memory store via `lib/mock-data/importJobStore.ts` and `lib/mock-data/reviewStore.ts`
- Seeded demo review data via `lib/mock-data/reviewSeedData.ts` when empty
- UI displays **Mock Mode** badge and warning banner
- Application continues to function for development

## Out of Scope (Future Phases)

- Browser automation and scrapers
- AI classification
- Queue workers
- Profile metadata extraction
- Google Places / website crawlers

## Roles

| Role      | Purpose                                      |
|-----------|----------------------------------------------|
| Admin     | Full platform access, approve/reject/merge   |
| Collector | Data discovery and import submission (read-only in Review Center) |
| Reviewer  | Record review, approval, and duplicate resolution |

Role permissions are defined in `lib/types/review.ts` (`REVIEW_ROLE_PERMISSIONS`).
