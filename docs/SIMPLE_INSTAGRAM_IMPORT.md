# Simple Instagram Import

A focused tool at `/instagram-import` for pasting Instagram profile links, extracting public metadata, exporting CSV, and sending records to the Revit24 import queue.

## How to paste links

1. Open **Instagram Import** in the sidebar (under Dashboard).
2. Paste one username or profile URL per line into the textarea.
3. Click **Preview Links** to validate and see counts.
4. Click **Start Extraction** to fetch public metadata.
5. Review results in the table.
6. **Export CSV** or **Send to Revit24 Import Queue**.

### Accepted formats

- `username`
- `@username`
- `instagram.com/username`
- `https://instagram.com/username/`
- `https://www.instagram.com/username/`

### Rejected formats

- Post, reel, story, explore, and hashtag URLs
- Empty lines
- Invalid usernames

Validation reuses `lib/validation/instagramProfileInput.ts` — no duplicated parsing logic.

## Data collected

Only publicly visible fields:

| Field | Description |
|-------|-------------|
| `username` | Instagram handle |
| `profileUrl` | Canonical profile URL |
| `displayName` | Public display name |
| `profileImageUrl` | Profile image URL when available |
| `bio` | Bio text |
| `website` | External link from profile |
| `publicEmail` | Only if visibly written in bio text |
| `extractionStatus` | `completed`, `mock`, or `failed` |
| `error` | Error message when extraction fails |
| `extractedAt` | ISO timestamp |

## Data NOT collected

- Hidden emails or phone numbers
- Private profiles, DMs, stories, posts
- Followers/following lists, comments, likes
- Login-only or authenticated data

## Extraction modes

| Mode | When |
|------|------|
| **Live** | `ENABLE_INSTAGRAM_EXTRACTION=true` — uses `InstagramPublicProfileProvider` |
| **Mock** | Default — returns placeholder display name, empty email, `extractionStatus: mock` |

No Playwright, queue screens, or pipeline UI in this workflow.

## CSV export

Click **Export CSV** to download:

```
username,profileUrl,displayName,profileImageUrl,bio,website,publicEmail,extractionStatus,error,extractedAt
```

Generated client-side from extraction results.

## Revit24 import queue

Click **Send to Revit24 Import Queue** to persist successful extractions (`completed` or `mock`) to Firestore collection `revit24_import_queue`:

| Field | Value |
|-------|-------|
| `source` | `"instagram"` |
| `status` | `"pending_review"` |
| Profile fields | username, profileUrl, displayName, profileImageUrl, bio, website, publicEmail |
| Timestamps | `createdAt`, `updatedAt` |

When Firebase is not configured, records are stored in local mock mode and a warning banner is shown.

## API routes

| Route | Purpose |
|-------|---------|
| `POST /api/instagram-import/extract` | Extract public metadata for valid profiles |
| `POST /api/instagram-import/queue` | Send extracted rows to `revit24_import_queue` |

## Files

| Path | Role |
|------|------|
| `app/(studio)/instagram-import/page.tsx` | Main page |
| `components/instagram-import/` | Form, summary, results table |
| `lib/validation/instagramSimpleInput.ts` | Thin wrapper over existing validation |
| `lib/services/instagramSimpleImportService.ts` | Extraction, CSV, queue |
| `lib/repositories/revit24ImportQueueRepository.ts` | Firestore persistence |
