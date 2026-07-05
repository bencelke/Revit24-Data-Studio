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
  api/             # Route handlers (import-jobs API)

components/
  layout/          # App shell, sidebar, top nav
  dashboard/       # Dashboard-specific UI
  imports/         # Import Center components
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

## Mock Mode

When Firebase is not configured:

- In-memory store via `lib/mock-data/importJobStore.ts`
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
| Admin     | Full platform access and configuration       |
| Collector | Data discovery and import submission         |
| Reviewer  | Record review, approval, and duplicate resolution |
