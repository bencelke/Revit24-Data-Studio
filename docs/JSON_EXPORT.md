# JSON Export

Revit24 Data Studio can export extracted Instagram profile results as a structured JSON file from the **Results** page.

## What the export contains

Each file is a versioned envelope with metadata and an array of profile records:

```json
{
  "exportedAt": "2026-07-06T16:30:00.000Z",
  "source": "revit24-data-studio",
  "version": "1.0",
  "recordCount": 2,
  "records": [
    {
      "source": "instagram",
      "username": "revit24official",
      "profileUrl": "https://www.instagram.com/revit24official/",
      "displayName": "Revit24",
      "profileImageUrl": "https://...",
      "bio": "Public bio text",
      "website": "https://revit24.com",
      "publicEmail": null,
      "status": "completed",
      "errorCode": null,
      "errorMessage": null,
      "extractedAt": "2026-07-06T16:25:00.000Z"
    }
  ]
}
```

Only **extracted** rows are included (completed, failed, or mock). Pending queue jobs without extraction data are excluded.

Failed extractions are included with `status`, `errorCode`, and `errorMessage` so you can review or re-queue them later.

## How to use it

1. Open `/results` in Data Studio.
2. Click **Export JSON**.
3. Your browser downloads:

   `revit24-instagram-export-YYYY-MM-DD.json`

Works in:

- **Mock mode** (browser localStorage)
- **Firebase live mode** (Firestore-loaded results)

No Firebase connection is required to download the file.

## JSON vs CSV export

| | JSON | CSV |
|---|------|-----|
| **Format** | Structured envelope + records array | Flat comma-separated rows |
| **Metadata** | `exportedAt`, `source`, `version`, `recordCount` | Header row only |
| **Nested data** | Easy to extend with new fields | Single flat row per profile |
| **Import tools** | Best for Revit24.com importer, APIs, scripts | Spreadsheets, Excel, quick review |
| **Human editing** | Less convenient | More convenient in Excel |

Use **JSON** when you want a portable data file for downstream systems. Use **CSV** for spreadsheet review or manual editing.

## Future: Revit24.com import

This JSON format is designed to become the input for a future Revit24.com importer:

1. Export profiles from Data Studio.
2. Upload or paste the JSON file into Revit24.com (planned).
3. Revit24.com validates `version`, maps `records`, and imports public profile data.

The envelope fields (`source`, `version`, `recordCount`) let the importer verify file origin and schema before processing records.

Until that importer exists, keep the JSON file as your canonical export archive or feed it into your own scripts.

## Implementation

Utility: `lib/utils/jsonExport.ts`

- `createInstagramExportPayload(records)` — builds the envelope object
- `exportInstagramResultsToJson(records)` — returns formatted JSON string
- `downloadJsonFile(data, filename)` — triggers browser download
