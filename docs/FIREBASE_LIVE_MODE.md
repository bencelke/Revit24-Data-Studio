# Firebase Live Mode

Revit24 Data Studio stores Instagram extraction results in Firestore when Firebase is configured. Without Firebase credentials, the app falls back to in-memory mock storage with a clear warning.

## Required environment variables

Copy `.env.example` to `.env.local` and set all Firebase values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Optional extraction settings:

```env
ENABLE_INSTAGRAM_EXTRACTION=true
INSTAGRAM_EXTRACTION_DELAY_MS=5000
INSTAGRAM_EXTRACTION_MAX_RETRIES=1
```

## Live mode vs mock mode

| Condition | Storage mode | Behavior |
|-----------|--------------|----------|
| All `NEXT_PUBLIC_FIREBASE_*` vars set | **Live** | Results saved to Firestore `instagram_extractions` |
| Any Firebase var missing | **Mock** | Results saved to in-memory store (session lost on restart) |

**Extraction enabled** is separate from storage mode. When `ENABLE_INSTAGRAM_EXTRACTION` is not `true`, the extractor uses mock profile data but still saves to Firestore if Firebase is configured.

The Settings page shows:

- **Firebase status**: Connected / Not Connected
- **Mode**: Live / Mock (storage)
- **Extraction enabled**: true / false

## Firestore collection

**Collection:** `instagram_extractions`

| Field | Type | Description |
|-------|------|-------------|
| id | string | Firestore document ID |
| source | string | Always `"instagram"` |
| username | string | Normalized lowercase handle |
| profileUrl | string | Canonical profile URL |
| profileImageUrl | string \| null | Public avatar URL |
| displayName | string \| null | Public display name |
| bio | string \| null | Public bio text |
| website | string \| null | Public website link |
| publicEmail | string \| null | Email visible in bio only |
| status | string | `completed`, `failed`, or `mock` |
| error | string \| null | Error message when failed |
| extractedAt | timestamp | When extraction ran |
| createdAt | timestamp | Document created |
| updatedAt | timestamp | Document last updated |

## How results are stored

1. User pastes profile links on **Instagram Extractor** and starts extraction.
2. `runInstagramExtraction()` validates input, runs the extraction provider, and skips usernames already in the collection.
3. New rows are written via `createExtractionResultsBatch()` in `lib/repositories/instagramExtractionsRepository.ts`.
4. The **Results** page loads from `listExtractionResults()` (Firestore or mock fallback).
5. Delete and Clear actions remove documents from the same store.

## Key files

| File | Purpose |
|------|---------|
| `lib/firebase/client.ts` | Client-safe Firebase entry point |
| `lib/firebase/config.ts` | Env config and collection names |
| `lib/firebase/firestore.ts` | Singleton Firestore instance |
| `lib/repositories/instagramExtractionsRepository.ts` | CRUD with mock fallback |
| `lib/services/instagramPublicExtractorService.ts` | Extract + save orchestration |
| `app/api/instagram-extractor/extract/route.ts` | Extraction API |
| `app/api/instagram-extractor/results/route.ts` | List results API |

## CSV export

CSV export works in both Live and Mock modes. It reads from the current results list (Firestore-backed when connected).
