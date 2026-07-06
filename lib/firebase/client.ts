/**
 * Client-safe Firebase entry point.
 * Re-exports singleton app and Firestore helpers without duplicate initialization.
 */
export { getFirebaseApp } from "./app";
export {
  getFirebaseConfig,
  isFirebaseConfigured,
  FIRESTORE_COLLECTIONS,
  type FirebaseConfig,
  type FirestoreCollectionName,
} from "./config";
export { getFirebaseFirestore, getCollectionRef } from "./firestore";
