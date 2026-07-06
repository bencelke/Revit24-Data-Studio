export const FIRESTORE_COLLECTIONS = {
  imports: "imports",
  profiles: "profiles",
  businesses: "businesses",
  events: "events",
  users: "users",
  logs: "logs",
  jobs: "jobs",
  import_jobs: "import_jobs",
  import_records: "import_records",
  approved_records: "approved_records",
  review_history: "review_history",
  extraction_jobs: "extraction_jobs",
  extraction_records: "extraction_records",
  worker_logs: "worker_logs",
  workers: "workers",
  instagram_profiles: "instagram_profiles",
  saved_searches: "saved_searches",
  places_search_jobs: "places_search_jobs",
  google_places_raw: "google_places_raw",
  website_jobs: "website_jobs",
  website_raw: "website_raw",
  csv_import_jobs: "csv_import_jobs",
  csv_import_records: "csv_import_records",
  merge_history: "merge_history",
  normalized_records: "normalized_records",
  entity_matches: "entity_matches",
  normalization_logs: "normalization_logs",
  pipeline_jobs: "pipeline_jobs",
  pipeline_events: "pipeline_events",
  publish_queue: "publish_queue",
  discovery_campaigns: "discovery_campaigns",
  discovery_jobs: "discovery_jobs",
  discovery_templates: "discovery_templates",
  discovery_results: "discovery_results",
  revit24_import_queue: "revit24_import_queue",
  instagram_extractions: "instagram_extractions",
  instagram_extraction_queue: "instagram_extraction_queue",
} as const;

export type FirestoreCollectionName =
  (typeof FIRESTORE_COLLECTIONS)[keyof typeof FIRESTORE_COLLECTIONS];

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export const FIREBASE_ENV_KEYS = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const;

function readEnv(key: string): string {
  return (process.env[key] ?? "").trim();
}

export function getFirebaseConfig(): FirebaseConfig {
  return {
    apiKey: readEnv("NEXT_PUBLIC_FIREBASE_API_KEY"),
    authDomain: readEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
    projectId: readEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
    storageBucket: readEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: readEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
    appId: readEnv("NEXT_PUBLIC_FIREBASE_APP_ID"),
  };
}

export function getMissingFirebaseEnvVars(): string[] {
  return FIREBASE_ENV_KEYS.filter((key) => readEnv(key).length === 0);
}

export function isFirebaseConfigured(): boolean {
  return getMissingFirebaseEnvVars().length === 0;
}
