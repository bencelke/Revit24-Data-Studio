# Instagram Real Public Profile Extractor

Revit24 Data Studio extracts **only publicly visible** Instagram profile metadata using a layered server-side fetch and parse pipeline.

## What data is collected

| Field | Source |
|-------|--------|
| username | Normalized profile handle |
| profileUrl | Canonical `https://www.instagram.com/{username}/` |
| displayName | Open Graph title, JSON metadata |
| profileImageUrl | `og:image`, embedded public image URLs |
| bio | `og:description`, public biography text |
| website | Public `external_url` when visible |
| publicEmail | Regex on visible bio text only |
| status | `completed`, `failed`, or `mock` |
| error | Human-readable failure message |
| extractedAt | ISO timestamp |

## What is NOT collected

- Hidden or private emails
- Private profile content
- DMs, followers, following lists
- Posts, stories, comments, likes
- Login-only data

The extractor does **not** use Instagram login, proxies, CAPTCHA bypass, or rate-limit evasion.

## Why hidden emails cannot be extracted

Emails are only captured when they appear in **public bio or profile text** visible without authentication. Instagram does not expose contact emails in page metadata for most accounts. The app never attempts to access hidden contact buttons or authenticated endpoints.

## Environment variables

```env
ENABLE_INSTAGRAM_EXTRACTION=false
INSTAGRAM_EXTRACTION_DELAY_MS=5000
INSTAGRAM_EXTRACTION_TIMEOUT_MS=30000
INSTAGRAM_EXTRACTION_MAX_RETRIES=1
```

Set `ENABLE_INSTAGRAM_EXTRACTION=true` only when ready to fetch real public pages.

When disabled, the app uses a **mock extractor** with clearly labeled mock data.

## Rate limiting

- Profiles are processed **sequentially** (no parallel requests)
- Configurable delay between profiles (`INSTAGRAM_EXTRACTION_DELAY_MS`)
- Max **1 retry** on retryable errors (`INSTAGRAM_EXTRACTION_MAX_RETRIES`)
- Failed profiles do not stop the batch

## Extraction strategy

1. Normalize input to username + profile URL
2. Server-side `fetch` with standard browser User-Agent
3. Parse Open Graph tags, JSON-LD, and embedded public JSON when present
4. Extract bio, display name, image, website from safe public signals
5. Extract email from visible bio text only
6. If blocked, rate-limited, or unavailable → return clear error (no bypass)

## Common failures

| Error | Meaning |
|-------|---------|
| `profile_not_found` | Username does not exist |
| `profile_private` | Account is private |
| `profile_unavailable` | Empty or unavailable response |
| `blocked` | Instagram blocked the request |
| `rate_limited` | Too many requests |
| `network_timeout` | Request timed out |
| `parse_failed` | No parseable public metadata |

## How to run extraction

1. Open **Instagram Extractor** (`/instagram-extractor`)
2. Paste profile links (one per line)
3. Click **Preview Links**
4. Click **Start Extraction**
5. Watch live progress (current profile, success/fail counts)
6. Open **Results** to review or export CSV

## Firestore output

Collection: `instagram_extractions`

If a username already exists, the record is **updated** (not duplicated).

See also: [FIREBASE_LIVE_MODE.md](./FIREBASE_LIVE_MODE.md)

## Key files

| File | Purpose |
|------|---------|
| `lib/providers/instagram/instagramPublicProfileProvider.ts` | Main provider |
| `lib/providers/instagram/instagramPublicProfileParser.ts` | HTML/metadata parser |
| `lib/utils/instagramMetadata.ts` | Pure extraction helpers |
| `lib/config/instagramExtractor.ts` | Feature flags and timing |
| `lib/services/instagramPublicExtractorService.ts` | Orchestration + Firestore upsert |
