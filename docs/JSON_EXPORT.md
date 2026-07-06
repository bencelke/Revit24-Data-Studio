# JSON Export

Revit24 Data Studio exports extracted Instagram profiles as JSON from the **Results** page. This file is designed for a future Revit24.com importer.

## Workflow

1. **Queue links** — Paste usernames/profile URLs on `/instagram-extractor`, then click **Create Extraction Job**.
2. **Run worker** — On your Mac: `npm run worker:instagram` (see [LOCAL_INSTAGRAM_WORKER.md](./LOCAL_INSTAGRAM_WORKER.md)).
3. **Review results** — Open `/results` and click **Refresh**.
4. **Export JSON** — Choose an export scope and click **Export JSON**.

Download: `revit24-instagram-profiles-YYYY-MM-DD.json`

## Export options

| Scope | Includes |
|-------|----------|
| **Successful only** (default) | Completed extractions only — ready for Revit24.com |
| **All records** | Successful and failed extractions |
| **Clubs only** | Successful profiles classified as `club` |
| **Members only** | Successful profiles classified as `member` |

Failed records are excluded by default.

## JSON schema

```json
{
  "exportedAt": "2026-07-06T00:00:00.000Z",
  "source": "revit24-data-studio",
  "version": "1.0",
  "recordCount": 123,
  "summary": {
    "clubs": 40,
    "members": 75,
    "unknown": 8,
    "success": 115,
    "failed": 8
  },
  "records": [
    {
      "source": "instagram",
      "entityType": "club",
      "username": "exampleclub",
      "profileUrl": "https://www.instagram.com/exampleclub/",
      "displayName": "Example Club",
      "profileImageUrl": "https://...",
      "bio": "...",
      "website": "https://...",
      "publicEmail": "example@email.com",
      "status": "success",
      "errorCode": "",
      "errorMessage": "",
      "extractedAt": "2026-07-06T00:00:00.000Z"
    }
  ]
}
```

## Entity type detection

Deterministic keyword rules in `lib/services/entityTypeDetectionService.ts`:

| Type | Rule |
|------|------|
| `club` | Username, display name, or bio contains: club, crew, community, team, gruppe, owners, drivers, society, cars, meet, meets, official, chapter |
| `member` | Successful extraction with no club-like terms |
| `unknown` | Failed extraction or insufficient data |

No AI is used. Manual override is planned for a later phase.

## JSON vs CSV

| | JSON | CSV |
|---|------|-----|
| **Best for** | Revit24.com import, scripts, APIs | Spreadsheets |
| **Envelope** | `exportedAt`, `version`, `summary`, `recordCount` | Header row only |
| **Entity type** | Included | Included |

CSV columns: `source,entityType,username,profileUrl,displayName,profileImageUrl,bio,website,publicEmail,status,errorCode,errorMessage,extractedAt`

## Future Revit24.com upload

1. Export JSON from Data Studio (successful profiles recommended).
2. Upload the file into Revit24.com when the importer ships.
3. Revit24.com validates `version` and `summary`, then imports `records`.

Until then, archive exports locally or process with your own tooling.

## Implementation

- `lib/utils/jsonExport.ts` — `createInstagramJsonExportPayload`, `exportInstagramProfilesToJson`, `downloadJsonFile`
- `lib/services/entityTypeDetectionService.ts` — `detectInstagramEntityType`
