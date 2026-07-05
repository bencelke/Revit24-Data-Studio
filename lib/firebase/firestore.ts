import {
  getFirestore,
  collection,
  type Firestore,
  type CollectionReference,
  type DocumentData,
} from "firebase/firestore";
import { getFirebaseApp } from "./app";
import {
  FIRESTORE_COLLECTIONS,
  type FirestoreCollectionName,
} from "./config";

let firestore: Firestore | null = null;

export function getFirebaseFirestore(): Firestore | null {
  const app = getFirebaseApp();
  if (!app) return null;

  if (!firestore) {
    firestore = getFirestore(app);
  }

  return firestore;
}

export function getCollectionRef<T extends DocumentData = DocumentData>(
  collectionName: FirestoreCollectionName,
): CollectionReference<T> | null {
  const db = getFirebaseFirestore();
  if (!db) return null;

  return collection(db, collectionName) as CollectionReference<T>;
}

export { FIRESTORE_COLLECTIONS };
