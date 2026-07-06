# Local Instagram Extraction Worker

Revit24 Data Studio queues Instagram profile extraction jobs in Firestore. The web UI runs on Vercel and **does not fetch Instagram directly**. Extraction runs from your Mac (or a VPS) using a local worker process.

## Why local extraction?

Instagram often blocks or limits serverless requests from platforms like Vercel. A stable residential IP (your Mac or VPS) is more reliable for fetching public profile pages.

The Data Studio UI still:

- Accepts pasted profile links
- Validates and normalizes usernames
- Creates queue records in Firestore
- Shows queue status and extraction results

## Architecture

```
Vercel (Data Studio UI)
  → POST /api/instagram-extractor/queue
  → Firestore: instagram_extraction_queue (status: pending)

Local worker (Mac/VPS)
  → npm run worker:instagram
  → reads pending queue records
  → fetches public Instagram HTML
  → saves results to instagram_extractions
  → updates queue status (success / failed)
```

## Firestore collections

### `instagram_extraction_queue`

Job queue created by the web app.

| Field | Description |
|-------|-------------|
| `username` | Normalized Instagram username |
| `profileUrl` | `https://www.instagram.com/{username}/` |
| `status` | `pending`, `running`, `success`, `failed`, `skipped` |
| `attempts` | Worker retry count |
| `errorCode` | Machine-readable error on failure |
| `errorMessage` | Human-readable error on failure |
| `startedAt` / `completedAt` | Worker timestamps |

### `instagram_extractions`

Extraction results (success or failed).

| Field | Description |
|-------|-------------|
| `username`, `profileUrl` | Profile identifiers |
| `entityType` | `club`, `member`, or `unknown` (keyword detection) |
| `displayName`, `bio`, `website`, `publicEmail` | Public metadata only |
| `profileImageUrl` | From og:image / twitter:image |
| `status` | `completed`, `failed`, `mock` |
| `errorCode`, `errorMessage` | Failure details |
| `extractedAt` | When extraction finished |

## Create extraction jobs (web app)

1. Open `/instagram-extractor` on your deployed Data Studio.
2. Paste profile links (one per line).
3. Click **Preview Links** to validate.
4. Click **Create Extraction Job**.
5. You should see: “Queued X profiles. Run the local worker to process them.”

## Run the worker (Mac)

### 1. Configure environment

Copy `.env.example` to `.env.local` and set Firebase + worker vars:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

ENABLE_INSTAGRAM_EXTRACTION=true
INSTAGRAM_WORKER_BATCH_SIZE=1
INSTAGRAM_WORKER_DELAY_MS=5000
INSTAGRAM_WORKER_MAX_RETRIES=1
INSTAGRAM_WORKER_TIMEOUT_MS=30000
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the worker

```bash
npm run worker:instagram
```

The worker processes all pending queue records, then exits.

### Example output

```
Revit24 Instagram extraction worker starting...
Profiles found: 2
Processing mafiosa_g80...
Fetch status: 200
Metadata found: false
Failed: parse_failed_no_metadata
Processing revit24official...
Fetch status: 200
Metadata found: true
Success: revit24official
Worker finished.
Processed: 2 · Succeeded: 1 · Failed: 1 · Remaining: 0
```

## View results and export JSON

Open `/results` in the web app and click **Refresh**. Summary cards show Pending, Running, Success, and Failed counts.

Filter by **Clubs**, **Members**, **Unknown**, **Success**, or **Failed**.

Click **Export JSON** to download `revit24-instagram-profiles-YYYY-MM-DD.json`. See [JSON_EXPORT.md](./JSON_EXPORT.md) for file structure and entity type rules.

Each saved profile includes `entityType` (`club`, `member`, or `unknown`) detected from username, display name, and bio using deterministic keyword rules.

## Future: Revit24.com upload

Export JSON from Data Studio, then upload the file into Revit24.com when the importer is available. No direct Firebase upload to Revit24 is required for this workflow.

## Allowed data (public only)

The worker extracts only publicly visible metadata:

- username, profile URL, display name, profile image
- bio, website, public email (only if visible in bio/text)

It does **not** extract private data, DMs, followers, posts, stories, or login-only content.

## Troubleshooting

| Error | Meaning |
|-------|---------|
| `parse_failed_no_metadata` | Instagram returned a page without OG/Twitter meta tags (often a login wall) |
| `instagram_blocked_request` | Request blocked (403/401) |
| `profile_not_found` | Profile does not exist (404) |
| `network_timeout` | Fetch timed out — increase `INSTAGRAM_WORKER_TIMEOUT_MS` |
| `fetch_failed` | Network or HTTP error |

**Firebase not configured:** Ensure all `NEXT_PUBLIC_FIREBASE_*` vars are set in `.env.local`.

**Queue not processing:** Confirm jobs exist with `status: pending` in `instagram_extraction_queue` in Firebase Console.

**No results in UI:** Click Refresh on `/results` after the worker finishes.

## VPS deployment (later)

Run the same worker on a VPS with the same `.env.local` values and a cron job or systemd timer:

```bash
npm run worker:instagram
```

Use conservative `INSTAGRAM_WORKER_DELAY_MS` (5000+ ms) and `INSTAGRAM_WORKER_BATCH_SIZE=1` to avoid aggressive scraping.
