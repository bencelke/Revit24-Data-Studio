# Firebase Connection — Revit24 Data Studio

Revit24 Data Studio connects to the **same Firebase project** as the public Revit24.com app. Extracted Instagram profiles are stored locally in `instagram_extractions` (or browser localStorage in mock mode) and can be uploaded to `revit24_import_queue` for Revit24.com to review and import later.

## Required Vercel environment variables

Copy the Firebase **Web App** config from the Revit24 Firebase console:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | e.g. `your-project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | e.g. `your-project.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase Web App ID |

### Where to find values

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select the **same project** used by Revit24.com
3. Project Settings → General → Your apps → Web app
4. Copy the config object values into Vercel

### Vercel setup

1. Open the `revit24-data-studio` project in Vercel
2. Settings → Environment Variables
3. Add all six `NEXT_PUBLIC_FIREBASE_*` variables for Production (and Preview if needed)
4. Redeploy after saving

**Do not commit `.env.local`.** Use `.env.example` as a template for local development only.

## Connection status

The app reports Firebase status in **Settings**:

| Status | Meaning |
|--------|---------|
| **Connected** | All env vars present; Firestore client initialized |
| **Missing Config** | One or more `NEXT_PUBLIC_FIREBASE_*` vars are empty |
| **Error** | Config present but initialization failed |

When Firebase is missing, Data Studio stays in **Local Mock Mode**:

- Extractions save to browser `localStorage`
- Upload to Revit24 is disabled until Firebase is configured

## Architecture

```
lib/firebase/
├── config.ts      # Env-based config, collection names
├── app.ts         # Singleton Firebase app (initialize once)
├── firestore.ts   # Singleton Firestore + collection refs
├── status.ts      # connected | missing_config | error
└── client.ts      # Client-safe exports
```

Server routes and repositories use `lib/repositories/firestore-client.ts` for Firestore access.

## Optional Admin SDK (future)

`.env.example` includes optional server-side variables for future Admin SDK use:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

These are **not required** for the current upload flow, which uses the Firebase Web client on the server.

## Security warning

> **Do not leave public unauthenticated writes enabled in production.**

Firestore security rules must restrict writes to `revit24_import_queue` and `instagram_extractions` to authorized Data Studio users. Auth and role-based access are planned for a future phase. Until then, tighten rules before enabling production uploads.

## Deployment

- **Platform:** Vercel
- **Production URL:** https://revit24-data-studio.vercel.app/
- **Repo:** https://github.com/bencelke/Revit24-Data-Studio

## Related docs

- [REVT24_IMPORT_QUEUE.md](./REVT24_IMPORT_QUEUE.md) — upload flow and collection schema
- [FIREBASE_LIVE_MODE.md](./FIREBASE_LIVE_MODE.md) — extraction storage modes
