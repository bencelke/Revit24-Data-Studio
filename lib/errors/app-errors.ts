export class FirestoreNotConfiguredError extends Error {
  constructor(message = "Firebase is not configured. Set environment variables in .env.local.") {
    super(message);
    this.name = "FirestoreNotConfiguredError";
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
  if (error instanceof AppError || error instanceof FirestoreNotConfiguredError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export const MOCK_MODE_WARNING =
  "Firebase is not configured. Using local mock storage.";
