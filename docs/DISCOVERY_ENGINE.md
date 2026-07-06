# Discovery Engine

Phase 16 introduces the Discovery Engine — a campaign-based system for building automotive discovery searches that flow into the existing import pipeline.

## Overview

```
Discovery Campaign
      ↓
Discovery Job
      ↓
Standardized Results
      ↓
Import Job
      ↓
Unified Pipeline (Phase 14)
```

Collectors define campaigns with keywords, locations, providers, and entity types. Running a campaign creates a discovery job, dispatches to the appropriate provider adapter, stores standardized results, and creates import jobs that enter the unified pipeline.

## Discovery Campaigns

| Field | Description |
|-------|-------------|
| `name` | Campaign title (e.g. BMW Clubs Germany) |
| `description` | Optional description |
| `country` / `state` / `city` / `area` | Geographic targeting |
| `radius` | Optional search radius (km) |
| `provider` | Target discovery provider |
| `entityTypes` | Club, shop, event, photographer, etc. |
| `keywords` | Search terms |
| `hashtags` | Hashtag targets (Instagram) |
| `brands` | Automotive brands |
| `vehicleTypes` | Vehicle categories |
| `languages` | Target languages |
| `status` | draft, active, paused, completed, archived |

### Firestore Collection: `discovery_campaigns`

## Discovery Jobs

Each campaign run creates a discovery job tracking:

- Provider execution
- Progress and duration
- Result counts (total, imported, duplicates, failed)
- Links to `importJobId` and `pipelineJobId`

### Firestore Collection: `discovery_jobs`

## Discovery Results

Standardized result shape across all providers:

| Field | Description |
|-------|-------------|
| `source` | Provider that found the result |
| `name` | Display name |
| `url` | Profile, place, or website URL |
| `entityType` | Classified entity type |
| `country` / `city` | Location |
| `status` | new, reviewed, imported, duplicate, rejected, queued |
| `confidence` | low, medium, high |
| `isDuplicate` | Duplicate flag |
| `isQueued` | Queued for import |

### Firestore Collection: `discovery_results`

## Discovery Templates

Reusable campaign templates for common searches:

- BMW Clubs, Mercedes Clubs, JDM Communities
- Performance Shops, Wrap Shops, Detailers
- Race Tracks, Car Photographers

### Firestore Collection: `discovery_templates`

## Provider Dispatch

The Discovery Engine never depends directly on Instagram or any single provider. Provider adapters implement a common interface:

| Provider | Status |
|----------|--------|
| Instagram | Active |
| Google Places | Active |
| Website | Active |
| CSV | Active |
| Manual | Active |
| Facebook, TikTok, YouTube, Discord, Reddit | Future |

`providerDispatchService.ts` routes campaigns to the correct adapter. Adapters generate standardized results without new scraping logic — they prepare discovery output and hand off to existing import flows.

## Keyword Builder

`keywordGenerationService.ts` combines:

- Country, city, area
- Keyword, brand, vehicle type
- Business category, hashtag

Examples: `BMW Stuttgart`, `BMW Club Germany`, `Wrap Shop Munich`, `Cars and Coffee Hamburg`

## Discovery Lifecycle

1. **Create campaign** — `/discovery/new` with keyword builder and templates
2. **Run discovery** — creates job, dispatches provider, stores results
3. **Import handoff** — creates import job from non-duplicate results
4. **Pipeline** — `startPipelineForImport()` links to unified pipeline
5. **Review** — normalized records enter review center (no auto-approve)

## Routes

| Route | Purpose |
|-------|---------|
| `/discovery` | Dashboard with summary cards |
| `/discovery/new` | Campaign builder |
| `/discovery/campaigns` | Campaign list |
| `/discovery/campaigns/[id]` | Campaign detail |
| `/discovery/jobs` | Discovery jobs |
| `/discovery/history` | Completed jobs and results |
| `/discovery/templates` | Template library |

## Services

| Service | Responsibility |
|---------|----------------|
| `discoveryService.ts` | Dashboard, job execution, history |
| `campaignService.ts` | Campaign CRUD |
| `keywordGenerationService.ts` | Keyword/hashtag generation |
| `providerDispatchService.ts` | Provider adapter registry and dispatch |

## What This Phase Does NOT Include

- AI or LLM discovery
- New scraping logic or worker changes
- Chrome extension
- Login automation, CAPTCHA bypass, proxy rotation
- ShiftIt synchronization
