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

export function getFirebaseConfig(): FirebaseConfig {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  };
}

export function isFirebaseConfigured(): boolean {
  const config = getFirebaseConfig();
  return Object.values(config).every((value) => value.length > 0);
}
