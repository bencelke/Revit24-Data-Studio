import type { Firestore } from "firebase/firestore";
import { getFirebaseFirestore } from "@/lib/firebase/firestore";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { FirestoreNotConfiguredError } from "@/lib/errors/app-errors";

export function getFirestoreDb(): Firestore {
  if (!isFirebaseConfigured()) {
    throw new FirestoreNotConfiguredError();
  }

  const db = getFirebaseFirestore();

  if (!db) {
    throw new FirestoreNotConfiguredError();
  }

  return db;
}

export function isFirestoreAvailable(): boolean {
  return isFirebaseConfigured() && getFirebaseFirestore() !== null;
}

export { isFirebaseConfigured };
