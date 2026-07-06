/**
 * Client-safe Firebase entry point.
 * Re-exports singleton app and Firestore helpers without duplicate initialization.
 */
export { getFirebaseApp } from "./app";
export {
  getFirebaseConfig,
  isFirebaseConfigured,
  getMissingFirebaseEnvVars,
  FIREBASE_ENV_KEYS,
  FIRESTORE_COLLECTIONS,
  type FirebaseConfig,
  type FirestoreCollectionName,
} from "./config";
export {
  getFirebaseConnectionStatus,
  getFirebaseProjectId,
  formatFirebaseStatusLabel,
  type FirebaseConnectionStatus,
} from "./status";
export { getFirebaseFirestore, getCollectionRef } from "./firestore";

/** Firestore database singleton (null when Firebase is not configured). */
export { getFirebaseFirestore as db } from "./firestore";
