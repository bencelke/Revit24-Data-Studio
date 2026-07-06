# Instagram Bulk Public Profile Extraction

Production bulk import and sequential extraction of **publicly visible** Instagram profile metadata into the Revit24 Data Studio pipeline.

## Bulk Import Flow

```
Collector pastes usernames / profile URLs at /imports/new/instagram
        ↓
parseInstagramBulkInput() validates and normalizes input
        ↓
import_jobs + import_records created
        ↓
startPipelineForImport({ provider: "instagram" })
        ↓
queueInstagramImportForExtraction() creates extraction_jobs (status: queued)
        ↓
Worker runtime claims job sequentially
        ↓
InstagramPublicProfileProvider extracts public metadata
        ↓
instagram_profiles (raw safe metadata)
        ↓
normalizeInstagramProfile() → normalized_records
        ↓
Duplicate detection → entity_matches (suggestions only)
        ↓
Review queue (manual approval required)
        ↓
Approved records → publish_queue → Revit24.com
```

## Allowed Data

Only publicly visible fields:

- Username, display name, profile URL, profile image URL
- Bio text, external website link
- Public email **only if visible in bio text**
- Public phone **only if visible in bio text**
- Follower / following / post counts when publicly visible
- Verified badge, business category when visible
- Extraction timestamp, status, worker version

## Disallowed Data

**Never collect:**

- Hidden emails or phone numbers
- DMs, private profiles, private posts, stories
- Followers/following lists, comments, likes, saved posts
- Login-only or authenticated data

**Never implement:**

- Instagram login automation
- Proxy rotation, CAPTCHA bypass, rate-limit bypass
- Account creation, aggressive scraping
- Post/reel downloading, follower/following scraping

## Environment Variables

```bash
ENABLE_INSTAGRAM_EXTRACTION=false
INSTAGRAM_EXTRACTION_DELAY_MS=5000
INSTAGRAM_EXTRACTION_TIMEOUT_MS=30000
INSTAGRAM_EXTRACTION_MAX_RETRIES=1
INSTAGRAM_EXTRACTION_BATCH_SIZE=1
```

| Variable | Default | Description |
|----------|---------|-------------|
| `ENABLE_INSTAGRAM_EXTRACTION` | `false` | Must be `true` for live extraction |
| `INSTAGRAM_EXTRACTION_DELAY_MS` | `5000` | Delay between sequential profiles |
| `INSTAGRAM_EXTRACTION_TIMEOUT_MS` | `30000` | Per-request timeout |
| `INSTAGRAM_EXTRACTION_MAX_RETRIES` | `1` | Retries per profile |
| `INSTAGRAM_EXTRACTION_BATCH_SIZE` | `1` | Profiles per worker cycle (sequential within batch) |

Optional: `INSTAGRAM_EXTRACTION_MODE=mock` forces mock even when enabled.

## Worker Setup

Run the worker runtime:

```bash
npm run worker
```

Or trigger a single cycle via API:

```bash
POST /api/workers/runtime/tick
```

The worker:

1. Claims `queued` or `retrying` extraction jobs
2. Processes records **sequentially** (no parallel extraction)
3. Respects delay between profiles
4. Retries once by default on retryable errors
5. Continues job even if individual profiles fail
6. Updates progress after each record

## Provider Architecture

```
workers/providers/instagram/     → re-exports
workers/instagram/               → implementation
  instagramPublicProfileProvider.ts
  instagramPublicProfileExtractor.ts
  instagramPublicProfileParser.ts
  instagramPublicProfileTypes.ts
workers/runtime/providers/
  instagramExtractionProvider.ts → worker runtime integration
```

Runtime calls providers through `ExtractionProvider` abstraction — never directly from UI.

## Error Types

| Code | Meaning |
|------|---------|
| `profile_not_found` | Username does not exist |
| `profile_private` | Profile is private |
| `profile_unavailable` | Temporarily unavailable |
| `parse_failed` | Could not parse public HTML/metadata |
| `network_timeout` | Request timed out |
| `rate_limited` | Rate limited by Instagram |
| `blocked` | Access blocked |
| `unknown_error` | Unexpected failure |

## Routes

| Route | Purpose |
|-------|---------|
| `/imports/new/instagram` | Bulk paste import |
| `/imports/history` | Import job history |
| `/imports/[id]` | Import job detail |
| `/instagram/extraction` | Extraction dashboard |
| `/instagram/profiles` | Extracted profiles list |
| `/instagram/profiles/[username]` | Profile detail preview |
| `/profiles/[username]` | Internal extraction review |
| `/queue` | Extraction job queue |
| `/pipeline` | Unified pipeline status |
| `/review` | Manual review (no auto-approval) |

## Review Flow

- Every extracted record is normalized and sent to **review**
- **No automatic approval**
- **No automatic publish**
- Duplicate suggestions appear in review — no auto-merge
- Admin approves/rejects manually
- Approved records enter `publish_queue` for Revit24.com

## Rate Limiting

- Sequential processing with configurable delay (default 5s)
- Batch size 1 by default
- Single retry on transient failures
- Fail gracefully and continue job

## Troubleshooting

| Issue | Check |
|-------|-------|
| Jobs stay in `waiting` | Should auto-queue on import; manually queue via `/queue/[jobId]` |
| Worker not processing | Run `npm run worker` or enable tick API |
| Mock data only | Set `ENABLE_INSTAGRAM_EXTRACTION=true` |
| Pipeline stuck at extracting | Worker must complete all records; pipeline advances on job completion |
| Private profiles failing | Expected — only public profiles are extracted |

## Collections

`import_jobs`, `import_records`, `pipeline_jobs`, `pipeline_events`, `extraction_jobs`, `extraction_records`, `instagram_profiles`, `normalized_records`, `entity_matches`, `review_history`, `approved_records`, `publish_queue`, `worker_logs`
