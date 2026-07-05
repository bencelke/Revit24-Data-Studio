# Revit24 Data Studio — Architecture

Internal administration platform for discovering, collecting, organizing, classifying, reviewing, approving, and importing publicly available automotive community data into ShiftIt.

## Tech Stack

- **Next.js 15+** App Router
- **TypeScript** (strict)
- **Tailwind CSS** + **shadcn/ui**
- **Firebase Authentication** (architecture prepared)
- **Firestore** (repository layer prepared)
- **Vercel** deployment target

## Directory Structure

```
app/
  (auth)/          # Authentication routes
  (studio)/        # Main application shell routes
  api/             # Route handlers

components/
  layout/          # App shell, sidebar, top nav
  dashboard/       # Dashboard-specific UI
  auth/            # Auth UI placeholders
  ui/              # shadcn/ui primitives

lib/
  firebase/        # Firebase initialization & auth contracts
  repositories/    # Firestore repository layer
  services/        # Application services (mock data in Phase 1)
  validation/      # Input validation schemas
  types/           # Shared TypeScript types
  utils/           # Utilities (cn, etc.)
```

## Phase 1 Scope

This phase establishes the SaaS foundation only:

- Admin dashboard layout with sidebar and top navigation
- Dashboard with mock statistics and recent activity
- Placeholder pages for Imports, Review, Queue, and Settings
- Firebase and Firestore architecture (no CRUD or auth logic)
- Repository contracts for future collections

## Out of Scope (Future Phases)

- Browser automation and scrapers
- AI classification
- Import logic and CSV processing
- Queue workers
- Google Maps integration

## Roles

| Role      | Purpose                                      |
|-----------|----------------------------------------------|
| Admin     | Full platform access and configuration       |
| Collector | Data discovery and import submission         |
| Reviewer  | Record review, approval, and duplicate resolution |
