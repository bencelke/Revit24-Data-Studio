import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirebaseConfig, isFirebaseConfigured } from "./config";

let app: FirebaseApp | undefined;

/**
 * Returns the Firebase app instance.
 * Initialization is deferred until Firebase credentials are configured.
 */
export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) {
    return null;
  }

  if (!app) {
    app = getApps().length > 0 ? getApps()[0] : initializeApp(getFirebaseConfig());
  }

  return app;
}
