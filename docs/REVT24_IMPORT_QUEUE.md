# Revit24 Import Queue

Data Studio uploads successful Instagram extractions to the Firestore collection **`revit24_import_queue`**. The public Revit24.com app can read, review, and import these entries in a future phase.

## Upload flow

```
Instagram Extractor
       ↓
  Extract profiles
       ↓
Results page (/results)
       ↓
User clicks "Upload to Revit24"
       ↓
POST /api/instagram-import/queue
       ↓
revit24_import_queue (Firestore)
       ↓
Revit24.com (future import/review UI)
```

## What gets uploaded

Only **successful** extractions are uploaded:

- `status === "completed"` (live extraction)
- `status === "mock"` (mock extraction)

Failed extractions are skipped and counted in the upload summary.

## Duplicate handling

Before writing, the repository checks existing queue records by **username** (case-insensitive).

| Outcome | Behavior |
|---------|----------|
| New username | Document created in `revit24_import_queue` |
| Duplicate username | Skipped; counted as "Duplicates skipped" |
| Failed extraction | Not uploaded; counted as "Failed extractions skipped" |

## Upload summary

After upload, the Results page shows:

- **Uploaded** — new records written
- **Duplicates skipped** — username already in queue
- **Failed extractions skipped** — extraction status was `failed`

## Collection schema

Collection: `revit24_import_queue`

| Field | Type | Value / notes |
|-------|------|----------------|
| `id` | string | Firestore document ID |
| `source` | string | `"revit24-data-studio"` |
| `sourcePlatform` | string | `"instagram"` |
| `username` | string | Lowercase Instagram username |
| `profileUrl` | string | Public profile URL |
| `displayName` | string \| null | Display name |
| `profileImageUrl` | string \| null | Avatar URL (not downloaded) |
| `bio` | string \| null | Profile bio |
| `website` | string \| null | External website |
| `publicEmail` | string \| null | Email from bio |
| `status` | string | `"pending_review"` |
| `createdAt` | ISO string | Created timestamp |
| `updatedAt` | ISO string | Last updated |
| `uploadedAt` | ISO string | Upload timestamp |
| `extractedAt` | ISO string | Original extraction time |
| `notes` | string \| null | Reserved for review notes |

## Results table — Upload Status column

| Badge | Meaning |
|-------|---------|
| Not uploaded | Successful extraction not yet uploaded this session |
| Uploaded | Written to `revit24_import_queue` |
| Duplicate | Username already existed in queue |
| Failed | Extraction failed; not eligible for upload |

Upload status is tracked in the UI for the current session. Records remain visible after upload.

## Repository API

`lib/repositories/revit24ImportQueueRepository.ts`

| Function | Description |
|----------|-------------|
| `uploadToRevit24ImportQueue(records)` | Upload with dedup; returns counts and errors |
| `listRevit24ImportQueue()` | List all queue documents |
| `findImportQueueRecordByUsername(username)` | Find by username |
| `deleteImportQueueRecord(id)` | Delete a queue document |

## Mock mode fallback

When Firebase env vars are missing:

- Extractions use browser `localStorage`
- Upload button is **disabled** (requires Firebase)
- Repository falls back to in-memory mock store for API testing only

Configure Firebase in Vercel to enable production uploads. See [FIREBASE_CONNECTION.md](./FIREBASE_CONNECTION.md).

## API endpoint

```
POST /api/instagram-import/queue
Content-Type: application/json

{
  "records": [ /* ExtractedInstagramProfile[] */ ]
}
```

Response:

```json
{
  "uploadedCount": 3,
  "skippedDuplicateCount": 1,
  "failedCount": 0,
  "errors": [],
  "uploadedUsernames": ["user1", "user2", "user3"],
  "duplicateUsernames": ["existing_user"],
  "dataMode": "firestore"
}
```

## Future work (not built yet)

- User authentication and authorized writes only
- Revit24.com admin review UI for `pending_review` records
- Two-factor / claim validation
- Server-side Firebase Admin for trusted writes

## Security

Restrict Firestore rules for `revit24_import_queue` in production. Do not allow open public writes. See security note in [FIREBASE_CONNECTION.md](./FIREBASE_CONNECTION.md).
