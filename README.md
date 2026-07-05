# Revit24 Data Studio

Internal administration platform for discovering, collecting, organizing, and importing publicly available automotive community data into ShiftIt.

## Getting Started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — redirects to `/dashboard`.

## Scripts

| Command         | Description              |
|-----------------|--------------------------|
| `npm run dev`   | Start development server |
| `npm run build` | Production build         |
| `npm run lint`  | Run ESLint               |
| `npm run start` | Start production server  |

## Documentation

- [Architecture](./docs/ARCHITECTURE.md)
- [Firestore Data Model](./docs/FIRESTORE.md)

## Phase 1

Foundation only — layout, dashboard mock data, Firebase/Firestore architecture. No business logic, scrapers, or import processing.
