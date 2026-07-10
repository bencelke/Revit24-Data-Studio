import type { FirebaseClientConfig } from "./firebaseEnv";
import {
  FIREBASE_ENV_KEYS,
  getFirebaseClientConfig,
  getMissingFirebaseEnvKeys,
  isFirebaseEnvConfigured,
  type FirebaseEnvKey,
} from "./firebaseEnv";

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

export type FirebaseConfig = FirebaseClientConfig;

export { FIREBASE_ENV_KEYS, type FirebaseEnvKey };

export function getFirebaseConfig(): FirebaseConfig {
  return getFirebaseClientConfig();
}

export function getMissingFirebaseEnvVars(): string[] {
  return getMissingFirebaseEnvKeys();
}

export function isFirebaseConfigured(): boolean {
  return isFirebaseEnvConfigured();
}

export {
  getFirebaseClientConfig,
  getFirebaseEnvStatus,
  type FirebaseEnvStatus,
} from "./firebaseEnv";
