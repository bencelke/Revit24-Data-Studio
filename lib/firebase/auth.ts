import {
  getAuth,
  type Auth,
  type User as FirebaseUser,
  type UserCredential,
} from "firebase/auth";
import { getFirebaseApp } from "./app";
import type { AppUser, UserRole } from "@/lib/types";

let auth: Auth | null = null;

export function getFirebaseAuth(): Auth | null {
  const app = getFirebaseApp();
  if (!app) return null;

  if (!auth) {
    auth = getAuth(app);
  }

  return auth;
}

export interface AuthService {
  signInWithEmail(email: string, password: string): Promise<UserCredential>;
  signOut(): Promise<void>;
  getCurrentUser(): FirebaseUser | null;
  mapFirebaseUser(user: FirebaseUser, role: UserRole): AppUser;
}

/**
 * Auth service contract for future Firebase Authentication integration.
 * Implementation will be added in a later phase.
 */
export const authService: AuthService = {
  async signInWithEmail(email: string, password: string): Promise<UserCredential> {
    void email;
    void password;
    throw new Error("Authentication is not implemented yet.");
  },

  async signOut(): Promise<void> {
    throw new Error("Authentication is not implemented yet.");
  },

  getCurrentUser(): FirebaseUser | null {
    return getFirebaseAuth()?.currentUser ?? null;
  },

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
