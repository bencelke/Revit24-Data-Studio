# Simple Revit24 Data Studio

Revit24 Data Studio is a focused internal tool for pasting Instagram profile links and extracting public metadata.

## Purpose

Three screens only:

| Screen | Route | Purpose |
|--------|-------|---------|
| Instagram Extractor | `/instagram-extractor` | Paste links, preview, extract |
| Results | `/results` | Review extractions, export CSV |
| Settings | `/settings` | Extractor configuration |

The home route `/` redirects to `/instagram-extractor`.

Legacy routes (dashboard, queue, pipeline, etc.) remain in the codebase but are hidden from the sidebar.

## Paste links flow

1. Open **Instagram Extractor**
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

## Extraction rules

Only publicly visible data is collected:

| Field | Source |
|-------|--------|
| username | Profile handle |
| profileUrl | Canonical profile URL |
| profileImageUrl | Public avatar |
| displayName | Public display name |
| bio | Public bio text |
| publicEmail | Only if visible in bio/profile text |
| website | Only if visible in profile |
| status | `completed`, `failed`, or `mock` |
| error | Failure message when applicable |
| extractedAt | ISO timestamp |

Not collected: hidden emails, private data, DMs, followers/following lists, posts, stories, comments, likes, or login-only data.

## CSV export

From **Results**, click **Export CSV**. Columns:

```
username,profileUrl,profileImageUrl,displayName,bio,website,publicEmail,status,error,extractedAt
```

## Upload (next phase)

Upload to Revit24.com is not enabled yet. The Results screen shows a disabled placeholder button for the next phase. Architecture is ready for:

- Mass upload to `revit24_import_queue`
- User claim system
- Account verification

## Settings

Read-only display of:

- Extractor mode (`live` or `mock`)
- Mock mode status
- Extraction enabled flag
- Delay between profiles
- Max retries

Configure via `.env.local`:

```
ENABLE_INSTAGRAM_EXTRACTION=true
INSTAGRAM_EXTRACTION_DELAY_MS=5000
INSTAGRAM_EXTRACTION_MAX_RETRIES=1
INSTAGRAM_EXTRACTION_MODE=mock
```

## Key files

| Area | Path |
|------|------|
| Extractor UI | `components/instagram-extractor/` |
| Results UI | `components/results/` |
| Settings UI | `components/settings/ExtractorSettingsPanel.tsx` |
| Types | `lib/types/instagramExtraction.ts` |
| Validation | `lib/validation/instagramInput.ts` |
| Service | `lib/services/instagramExtractionService.ts` |
| CSV | `lib/utils/csvExport.ts` |
| Session storage | `lib/utils/extractionStorage.ts` |
