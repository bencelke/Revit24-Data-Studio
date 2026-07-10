import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getFirebaseClientConfig, isFirebaseEnvConfigured } from "./firebaseEnv";

let app: FirebaseApp | undefined;
let initError: Error | null = null;

export function getFirebaseInitError(): Error | null {
  return initError;
}

/**
 * Returns the Firebase app instance.
 * Initialization is deferred until Firebase credentials are configured.
 */
export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseEnvConfigured()) {
    initError = null;
    return null;
  }

  if (!app) {
    try {
      app = getApps().length > 0 ? getApps()[0] : initializeApp(getFirebaseClientConfig());
      initError = null;
    } catch (error) {
      initError = error instanceof Error ? error : new Error(String(error));
      console.error("[firebase] Initialization failed:", initError.message);
      return null;
    }
  }

  return app;
}

export function isFirebaseClientReady(): boolean {
  return isFirebaseEnvConfigured() && getFirebaseApp() != null;
}
