export const FIREBASE_ENV_KEYS = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const;

export type FirebaseEnvKey = (typeof FIREBASE_ENV_KEYS)[number];

export type FirebaseEnvStatus = {
  configured: boolean;
  projectId: string;
  authDomain: string;
  missingKeys: FirebaseEnvKey[];
};

export type FirebaseClientConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

function trim(value: string | undefined): string {
  return (value ?? "").trim();
}

/**
 * Read Firebase env with literal process.env access so Next.js inlines
 * NEXT_PUBLIC_* values into the client bundle.
 */
export function getFirebaseEnvValues(): FirebaseClientConfig {
  return {
    apiKey: trim(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
    authDomain: trim(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
    projectId: trim(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
    storageBucket: trim(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
    messagingSenderId: trim(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
    appId: trim(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
  };
}

export function getFirebaseEnvStatus(): FirebaseEnvStatus {
  const values = getFirebaseEnvValues();
  const missingKeys: FirebaseEnvKey[] = [];

  if (!values.apiKey) missingKeys.push("NEXT_PUBLIC_FIREBASE_API_KEY");
  if (!values.authDomain) missingKeys.push("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
  if (!values.projectId) missingKeys.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  if (!values.storageBucket) missingKeys.push("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET");
  if (!values.messagingSenderId) missingKeys.push("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID");
  if (!values.appId) missingKeys.push("NEXT_PUBLIC_FIREBASE_APP_ID");

  return {
    configured: missingKeys.length === 0,
    projectId: values.projectId,
    authDomain: values.authDomain,
    missingKeys,
  };
}

export function getFirebaseClientConfig(): FirebaseClientConfig {
  return getFirebaseEnvValues();
}

export function isFirebaseEnvConfigured(): boolean {
  return getFirebaseEnvStatus().configured;
}

export function getMissingFirebaseEnvKeys(): FirebaseEnvKey[] {
  return getFirebaseEnvStatus().missingKeys;
}
