# JSON Export

Revit24 Data Studio exports extracted Instagram profiles as a structured JSON file from the **Results** page. This is the primary handoff format for a future Revit24.com importer.

## Workflow

1. Paste profile links on `/instagram-extractor` and click **Create Extraction Job**.
2. Run `npm run worker:instagram` on your Mac to process the queue.
3. Open `/results`, review profiles, filter by club/member/status.
4. Click **Export JSON** to download `revit24-instagram-profiles-YYYY-MM-DD.json`.

## File structure

```json
{
  "exportedAt": "2026-07-06T16:30:00.000Z",
  "source": "revit24-data-studio",
  "version": "1.0",
  "recordCount": 2,
  "records": [
    {
      "source": "instagram",
      "entityType": "club",
      "username": "revit24official",
      "profileUrl": "https://www.instagram.com/revit24official/",
      "displayName": "Revit24",
      "profileImageUrl": "https://...",
      "bio": "...",
      "website": "https://revit24.com",
      "publicEmail": null,
      "status": "success",
      "errorCode": "",
      "errorMessage": "",
      "extractedAt": "2026-07-06T16:25:00.000Z"
    }
  ]
}
```

Only **extracted** rows are included (not pending queue jobs). Failed extractions are included with error fields.

## Entity type detection

Each record includes `entityType`:

| Value | Meaning |
|-------|---------|
| `club` | Username, display name, or bio contains club-like terms (club, crew, community, team, official, meet, etc.) |
| `member` | No club terms found — treated as individual enthusiast |
| `unknown` | Not enough text to classify |

Detection is **deterministic keyword rules only** — no AI. Manual override is planned for a later phase.

## JSON vs CSV

| | JSON | CSV |
|---|------|-----|
| **Purpose** | Revit24.com import, APIs, scripts | Spreadsheets, quick review |
| **Structure** | Versioned envelope + typed records | Flat rows |
| **Entity type** | Included | Included |
| **Metadata** | `exportedAt`, `version`, `recordCount` | Header row only |

## Future Revit24.com upload

The JSON envelope (`source`, `version`, `recordCount`) lets Revit24.com validate the file before import. Until the importer ships, archive exports locally or process them with your own scripts.

## Implementation

`lib/utils/jsonExport.ts`

- `createInstagramJsonExportPayload(records)`
- `exportInstagramProfilesToJson(records)`
- `downloadJsonFile(payload, filename)`

Entity detection: `lib/utils/instagramEntityType.ts` → `detectInstagramEntityType()`
