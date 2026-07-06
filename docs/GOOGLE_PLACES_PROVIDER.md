# Google Places Provider (Phase 17)

Production Google Places discovery using the **official Google Places API** (Text Search, Nearby Search, Place Details, photo metadata). Results flow through the existing Revit24 import pipeline — no separate entity model.

## API Setup

### 1. Enable APIs in Google Cloud Console

Enable these APIs for your project:

- **Places API** (legacy endpoints used: Text Search, Nearby Search, Place Details, Place Photo)
- Billing must be enabled on the project

### 2. Create an API key

1. Go to **APIs & Services → Credentials**
2. Create an **API key**
3. Restrict the key to Places API and your server IPs (recommended for production)

### 3. Environment variables

Add to `.env.local`:

```bash
GOOGLE_PLACES_API_KEY=your_api_key_here
ENABLE_GOOGLE_PLACES=true

# Optional
GOOGLE_PLACES_DEFAULT_RADIUS=5000
GOOGLE_PLACES_DEFAULT_LIMIT=20
GOOGLE_PLACES_DEFAULT_LANGUAGE=en
GOOGLE_PLACES_DEFAULT_REGION=
GOOGLE_PLACES_TIMEOUT_MS=30000
GOOGLE_PLACES_MAX_RETRIES=2
GOOGLE_PLACES_RETRY_DELAY_MS=1000
```

| Variable | Default | Description |
|----------|---------|-------------|
| `GOOGLE_PLACES_API_KEY` | — | Server-only API key (never expose as `NEXT_PUBLIC_`) |
| `ENABLE_GOOGLE_PLACES` | `false` | Must be `true` **and** key set to use live API |
| `GOOGLE_PLACES_DEFAULT_RADIUS` | `5000` | Default nearby search radius (meters) |
| `GOOGLE_PLACES_DEFAULT_LIMIT` | `20` | Max results per search |
| `GOOGLE_PLACES_TIMEOUT_MS` | `30000` | Per-request timeout |
| `GOOGLE_PLACES_MAX_RETRIES` | `2` | Retries on transient failures |

When `ENABLE_GOOGLE_PLACES` is false or no API key is set, the studio uses **mock automotive businesses** for development.

## Provider Flow

```
Collector creates search (UI or API)
        ↓
googlePlacesSearchService.executeGooglePlacesSearch()
        ↓
googlePlacesProvider (production) OR mock provider
        ↓
Raw results → google_places_raw (Firestore)
        ↓
placesNormalizationService (via googlePlacesNormalizationService)
        ↓
placesDuplicateService (website, phone, coordinates, name, place ID)
        ↓
Review queue → approval → unified import pipeline
```

### Key services

| Service | Role |
|---------|------|
| `googlePlacesProvider.ts` | Official API client: Text/Nearby Search, Place Details, pagination, retry/timeout |
| `googlePlacesSearchService.ts` | Job orchestration: execute, rerun, clone, schedule |
| `googlePlacesNormalizationService.ts` | Re-exports existing normalization (no new model) |
| `placesSearchService.ts` | Page data and facade for UI/API routes |

### Supported search types

- **Text Search** — keyword + location fields combined into query string
- **Nearby Search** — requires `latitude` and `longitude`; optional keyword, category, radius
- **Keyword / Category** — resolved automatically from query fields

### Raw document fields (`google_places_raw`)

Place ID, business name, address, coordinates, phone, website, Google Maps URL, business types (as category), opening hours, rating, review count, photo references (metadata only), business status.

## Search Lifecycle

1. **Create** — `POST /api/google-places/search` creates a `places_search_jobs` record with status `running`
2. **Execute** — Provider fetches results, enriches with Place Details, persists to `google_places_raw`
3. **Complete** — Job status → `completed` with `totalResults`; or `failed` with `errorMessage`
4. **Rerun** — `POST /api/google-places/search/[jobId]/rerun` re-executes the same query (new job, `clonedFromJobId` set)
5. **Clone** — `POST /api/google-places/search/[jobId]/clone` same as rerun
6. **Schedule** — `POST /api/google-places/search/schedule` creates a `pending` job with `scheduledAt` (execution deferred)

Search history is visible at `/google-places/jobs` with rerun and clone actions.

## Quota Management

Google Places API usage is billed per request. This provider:

- Fetches **Place Details** per result (higher cost) for phone, website, hours
- Paginates with `next_page_token` (2s delay between pages per Google requirements)
- Retries on `OVER_QUERY_LIMIT` and network errors up to `GOOGLE_PLACES_MAX_RETRIES`
- Maps errors to typed codes: `INVALID_API_KEY`, `QUOTA_EXCEEDED`, `RATE_LIMITED`, `TIMEOUT`, `NETWORK_FAILURE`, `NO_RESULTS`

**Recommendations:**

- Set conservative `resultLimit` (default 20)
- Monitor usage in Google Cloud Console → APIs & Services → Places API → Metrics
- Use API key restrictions and separate keys per environment
- Disable `ENABLE_GOOGLE_PLACES` in dev unless testing live data

## UI

| Route | Components |
|-------|------------|
| `/google-places/search` | `GoogleSearchForm`, `GoogleSummaryCards` |
| `/google-places/results` | `GoogleResultsTable`, `BusinessPreviewCard` |
| `/google-places/[placeId]` | `PlaceDetailsCard` |
| `/google-places/jobs` | `GooglePlacesJobsClient` |

## Important

- **Do not scrape Google** — only official APIs
- API key is server-side only (`GOOGLE_PLACES_API_KEY`)
- Photo references are stored; image URLs are not rendered in this phase
