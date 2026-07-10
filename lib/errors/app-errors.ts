export class FirestoreNotConfiguredError extends Error {
  constructor(
    message = "Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* values to .env.local and restart the dev server.",
  ) {
    super(message);
    this.name = "FirestoreNotConfiguredError";
  }
}

export class FirebaseNotConfiguredError extends Error {
  readonly missingKeys: string[];

  constructor(missingKeys: string[] = []) {
    const suffix =
      missingKeys.length > 0
        ? ` Missing env values: ${missingKeys.join(", ")}`
        : " Add NEXT_PUBLIC_FIREBASE_* values to .env.local and restart the dev server.";
    super(`Firebase is not configured.${suffix}`);
    this.name = "FirebaseNotConfiguredError";
    this.missingKeys = missingKeys;
  }
}

export class FirebaseInitError extends Error {
  constructor(
    message = "Firebase config loaded but Firebase initialization failed. Check client config.",
  ) {
    super(message);
    this.name = "FirebaseInitError";
  }
}

export class FirebaseAuthRequiredError extends Error {
  constructor(message = "Firebase sign-in required before creating extraction jobs.") {
    super(message);
    this.name = "FirebaseAuthRequiredError";
  }
}

export class AppError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function getErrorMessage(error: unknown, fallback = "An unexpected error occurred."): string {
  if (
    error instanceof AppError ||
    error instanceof FirestoreNotConfiguredError ||
    error instanceof FirebaseNotConfiguredError ||
    error instanceof FirebaseInitError ||
    error instanceof FirebaseAuthRequiredError
  ) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export function isFirestorePermissionDenied(error: unknown): boolean {
  if (typeof error === "object" && error !== null) {
    const code = (error as { code?: string }).code;
    if (code === "permission-denied") {
      return true;
    }
  }

  if (error instanceof Error && error.message.includes("permission-denied")) {
    return true;
  }

  return false;
}

export function getInstagramQueueErrorMessage(error: unknown): string {
  if (error instanceof FirebaseAuthRequiredError) {
    return error.message;
  }

  if (isFirestorePermissionDenied(error)) {
    return "Firestore permission denied. Confirm the signed-in email is approved and sourcePlatform is instagram.";
  }

  if (error instanceof FirebaseNotConfiguredError || error instanceof FirestoreNotConfiguredError) {
    return error.message;
  }

  if (error instanceof FirebaseInitError) {
    return error.message;
  }

  return "Could not create extraction job. Check Firebase configuration and permissions.";
}

export function formatInstagramQueueSuccessMessage(queued: number, skipped: number): string {
  if (queued === 1 && skipped === 0) {
    return "Queued 1 Instagram profile.";
  }

  if (skipped > 0) {
    const rowLabel = skipped === 1 ? "row" : "rows";
    return `Queued ${queued} profile${queued === 1 ? "" : "s"}. Skipped ${skipped} invalid or duplicate ${rowLabel}.`;
  }

  return `Queued ${queued} Instagram profile${queued === 1 ? "" : "s"}.`;
}

export const MOCK_MODE_WARNING =
  "Firebase is not configured. Using local mock storage.";
