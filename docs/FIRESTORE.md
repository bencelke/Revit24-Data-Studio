# Firestore Data Model

Repository layer prepared for the following collections. CRUD operations will be implemented in future phases.

## Collections

| Collection   | Purpose                                      |
|--------------|----------------------------------------------|
| `imports`    | Raw import batches and source payloads       |
| `profiles`   | Instagram and social profile records         |
| `businesses` | Google Places and business listings          |
| `events`     | Car events and community gatherings          |
| `users`      | Platform users with role assignments         |
| `logs`       | Audit trail and system activity              |
| `jobs`       | Background job queue and processing state    |

## Repository Pattern

Each collection has a dedicated repository extending `BaseRepository<T>`:

```typescript
// lib/repositories/imports.repository.ts
export const importsRepository = new ImportsRepository();
```

Repositories expose a consistent interface:

- `findById(id)`
- `findAll(constraints?)`
- `create(data)`
- `update(id, data)`
- `delete(id)`

All methods throw "not implemented" until Phase 2+.

## Environment Variables

See `.env.example` for required Firebase configuration.
