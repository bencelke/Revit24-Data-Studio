import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type Auth,
  type User as FirebaseUser,
  type UserCredential,
} from "firebase/auth";
import { getFirebaseApp, getFirebaseInitError } from "./app";
import {
  FirebaseInitError,
  FirebaseNotConfiguredError,
  FirestoreNotConfiguredError,
} from "@/lib/errors/app-errors";
import { getFirebaseEnvStatus } from "./firebaseEnv";
import type { AppUser, UserRole } from "@/lib/types";

let auth: Auth | null = null;

function assertFirebaseReady(): Auth {
  const envStatus = getFirebaseEnvStatus();
  if (!envStatus.configured) {
    throw new FirebaseNotConfiguredError(envStatus.missingKeys);
  }

  const initError = getFirebaseInitError();
  if (initError) {
    throw new FirebaseInitError(initError.message);
  }

  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) {
    throw new FirebaseInitError();
  }

  if (!auth) {
    auth = getAuth(firebaseApp);
  }

  return auth;
}

export function getFirebaseAuth(): Auth | null {
  try {
    return assertFirebaseReady();
  } catch {
    return null;
  }
}

export function subscribeToAuthState(
  listener: (user: FirebaseUser | null) => void,
): (() => void) | null {
  const firebaseAuth = getFirebaseAuth();
  if (!firebaseAuth) {
    listener(null);
    return null;
  }

  return onAuthStateChanged(firebaseAuth, listener);
}

export async function signInWithEmail(email: string, password: string): Promise<UserCredential> {
  const firebaseAuth = assertFirebaseReady();
  return signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
}

export async function signOut(): Promise<void> {
  const firebaseAuth = getFirebaseAuth();
  if (!firebaseAuth) {
    return;
  }

  await firebaseSignOut(firebaseAuth);
}

export function getCurrentFirebaseUser(): FirebaseUser | null {
  return getFirebaseAuth()?.currentUser ?? null;
}

export interface AuthService {
  signInWithEmail(email: string, password: string): Promise<UserCredential>;
  signOut(): Promise<void>;
  getCurrentUser(): FirebaseUser | null;
  mapFirebaseUser(user: FirebaseUser, role: UserRole): AppUser;
}

/** @deprecated Use FirebaseNotConfiguredError */
export { FirestoreNotConfiguredError };

export const authService: AuthService = {
  signInWithEmail,
  signOut,
  getCurrentUser: getCurrentFirebaseUser,
  mapFirebaseUser(user: FirebaseUser, role: UserRole): AppUser {
    return {
      uid: user.uid,
      email: user.email ?? "",
      displayName: user.displayName,
      photoURL: user.photoURL,
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },
};
