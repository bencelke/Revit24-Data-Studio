# Instagram Public Metadata Provider

Phase 15 implements real public profile metadata extraction for Instagram, connected to the existing worker runtime and queue system.

## Allowed Data

Only publicly visible metadata is collected:

| Field | Source |
|-------|--------|
| Username | Profile URL / page metadata |
| Display name | OG tags, shared JSON, ld+json |
| Bio | OG description, shared JSON |
| Profile URL | Normalized input |
| Profile image URL | OG image, shared JSON |
| External website | Public `external_url` field |
| Public email | Visible bio text only (regex) |
| Public phone | Visible bio text only (regex) |
| Follower count | Public counts when visible |
| Following count | Public counts when visible |
| Post count | Public counts when visible |
| Verified badge | Public verification flag |
| Business category | Public category field |
| Extraction timestamp | Worker runtime |
| Worker version | Provider version |
| Status | completed / failed / private / not_found |

## Disallowed Data

The provider must **never** collect:

- Hidden emails or phone numbers
- DMs, stories, private posts, saved posts
- Followers/following lists
- Comments, likes, or engagement data
- Login-only or authenticated content

Also not implemented:

- Login automation
- Proxy rotation
- CAPTCHA bypass
- Rate-limit bypass
- Account creation
- Aggressive scraping
- Post/reel downloading

## Provider Flow

```
Input (username or profile URL)
  → Normalize input
  → Fetch public profile page (if enabled)
  → Parse OG meta, shared JSON, ld+json
  → Extract bio-visible email/phone only
  → Return structured metadata
  → Save to instagram_profiles
  → Run normalization pipeline
  → Send to review (no auto-approve, no publish)
```

### Files

| File | Role |
|------|------|
| `workers/instagram/instagramPublicProfileProvider.ts` | `ProfileExtractionProvider` implementation |
| `workers/instagram/instagramPublicProfileExtractor.ts` | Fetch, retry, timeout, rate limiting |
| `workers/instagram/instagramPublicProfileParser.ts` | Multi-layer HTML/metadata parsing |
| `workers/instagram/instagramPublicProfileTypes.ts` | Error types and metadata shapes |
| `lib/config/instagramProvider.ts` | Runtime configuration |

Legacy files (`instagramProfileExtractor.ts`, `instagramProfileParser.ts`) delegate to the public provider for backward compatibility.

## Rate Limits

Conservative defaults (configurable via environment):

| Setting | Default | Env var |
|---------|---------|---------|
| Sequential processing | Yes | Worker runner processes one profile at a time |
| Delay between profiles | 5000ms | `INSTAGRAM_EXTRACTION_DELAY_MS` |
| Request timeout | 30000ms | `INSTAGRAM_EXTRACTION_TIMEOUT_MS` |
| Max retries | 1 | `INSTAGRAM_EXTRACTION_MAX_RETRIES` |

No parallel scraping by default.

## Error Handling

| Error code | Meaning | Retryable |
|------------|---------|-----------|
| `profile_not_found` | Username does not exist | No |
| `profile_private` | Account is private | No |
| `profile_unavailable` | Empty or unavailable response | Yes |
| `parse_failed` | Could not parse metadata | Yes |
| `network_timeout` | Request timed out | Yes |
| `rate_limited` | HTTP 429 or rate limit page | Yes |
| `blocked` | HTTP 403 or checkpoint page | Yes |
| `unknown_error` | Unexpected failure | Varies |

Failed extractions are stored in `instagram_profiles` with appropriate status. Extraction records and worker logs capture per-record failures.

## Enable / Disable Extraction

```bash
# Disabled by default (mock data for UI tests)
ENABLE_INSTAGRAM_EXTRACTION=false

# Enable live extraction
ENABLE_INSTAGRAM_EXTRACTION=true

# Force mock even when enabled
INSTAGRAM_EXTRACTION_MODE=mock
```

When disabled, the test page shows **Instagram Extraction Disabled** and uses mock data for UI testing.

## Test a Single Extraction

Internal route: `/instagram/test`

1. Open `/instagram/test` in Data Studio
2. Enter a username (`@bmw`) or profile URL
3. Click **Run Test Extraction**
4. Review the profile preview, raw safe metadata, or error card

API: `POST /api/instagram/test` with `{ "input": "@username" }`

## Queue Integration

When an Instagram extraction job runs via the worker runtime:

1. `InstagramExtractionProvider.executeJob()` claims records from `extraction_records`
2. `InstagramWorkerRunner` processes sequentially with configured delay
3. `InstagramPublicProfileProvider` extracts each profile
4. Results saved to `instagram_profiles`
5. `normalizeInstagramProfile()` runs the existing normalization pipeline
6. Normalized records go to review — **not** auto-approved or published
7. `worker_logs` and `pipeline_events` record each stage

Run the worker: `npm run worker`

Or trigger a single cycle: `POST /api/workers/runtime/tick`

## Firestore Collections

| Collection | Written by provider |
|------------|---------------------|
| `instagram_profiles` | Extracted metadata |
| `extraction_records` | Per-record status |
| `extraction_jobs` | Job progress |
| `normalized_records` | Via normalization pipeline |
| `worker_logs` | Worker runtime |
| `pipeline_events` | Pipeline stage logging (when linked import job exists) |
