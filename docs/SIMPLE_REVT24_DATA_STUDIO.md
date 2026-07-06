# Simple Revit24 Data Studio

Revit24 Data Studio is a focused internal tool for pasting Instagram profile links, extracting public metadata, and preparing records for the public Revit24.com app.

## Purpose

Three screens only:

| Screen | Route | Purpose |
|--------|-------|---------|
| Instagram Import | `/instagram-import` | Paste links, preview, extract |
| Results | `/results` | Review extractions, export CSV, upload |
| Settings | `/settings` | Firebase and extraction config |

The home route `/` redirects to `/instagram-import`.

Legacy routes (dashboard, queue, pipeline, etc.) remain in the codebase but are hidden from the sidebar.

## Paste links flow

1. Open **Instagram Import**
2. Paste one username or profile URL per line
3. Click **Preview Links** — see total, valid, duplicate, invalid counts
4. Click **Start Extraction** — profiles are extracted sequentially
5. You are redirected to **Results** automatically

### Accepted input

- `username`
- `@username`
- `instagram.com/username`
- `https://instagram.com/username/`
- `https://www.instagram.com/username/`

### Rejected input

- Post, reel, story, explore URLs
- Hashtags
- Empty lines
- Invalid usernames

Validation uses `lib/validation/instagramProfileInput.ts` (no duplicated logic).

## Extraction rules

### Collected (public only)

- Username / profile URL
- Profile image URL
- Display name
- Public email **only if visible in bio/profile text**
- Status and extraction timestamp

### Never collected

- Hidden emails, private data, DMs
- Followers/following lists, posts, stories, comments, likes
- Login-only data

### Modes

| Mode | Condition |
|------|-----------|
| Live | `ENABLE_INSTAGRAM_EXTRACTION=true` |
| Mock | Default — placeholder display name, empty email |

## CSV export

On the **Results** screen, click **Export CSV**.

Columns:

```
username,profileUrl,displayName,profileImageUrl,publicEmail,status,error,extractedAt
```

## Firestore upload queue

Click **Upload to Revit24** on the Results screen.

Records are saved to `revit24_import_queue`:

| Field | Value |
|-------|-------|
| `source` | `"instagram"` |
| `status` | `"pending_review"` |
| Profile fields | username, profileUrl, displayName, profileImageUrl, publicEmail |
| Timestamps | createdAt, updatedAt |

The upload response reports:

- Success count
- Failed count (failed extractions skipped)
- Duplicate warning if username already exists in the queue

When Firebase is not configured, mock mode is used and a warning banner is shown. CSV export still works.

## Key files

| Path | Role |
|------|------|
| `lib/types/simpleInstagramImport.ts` | Types |
| `lib/validation/simpleInstagramInput.ts` | Input parsing |
| `lib/services/simpleInstagramImportService.ts` | Extraction and upload |
| `lib/repositories/revit24ImportQueueRepository.ts` | Firestore queue |
| `lib/utils/csvExport.ts` | CSV generation |
| `lib/utils/simpleImportStorage.ts` | Session storage between Import → Results |
| `components/instagram-import/` | Import screen |
| `components/results/` | Results screen |
| `components/settings/SimpleSettingsPanel.tsx` | Settings screen |
