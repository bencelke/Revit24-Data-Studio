#!/usr/bin/env node

import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, getFirestore, setDoc } from "firebase/firestore";
import { loadEnvLocal, readEnv } from "./lib/load-env-local.mjs";
import {
  buildQueueRecord,
  parseInstagramProfileInputs,
} from "./lib/instagram-profile-parse.mjs";

const QUEUE_COLLECTION = "instagram_extraction_queue";

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function getFirebaseConfig() {
  return {
    apiKey: readEnv("NEXT_PUBLIC_FIREBASE_API_KEY"),
    authDomain: readEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
    projectId: readEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
    storageBucket: readEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: readEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
    appId: readEnv("NEXT_PUBLIC_FIREBASE_APP_ID"),
  };
}

async function findActiveQueueItem(db, username) {
  const documentId = `instagram-profile-${username.toLowerCase()}`;
  const snapshot = await getDoc(doc(db, QUEUE_COLLECTION, documentId));
  if (!snapshot.exists()) {
    return null;
  }

  const status = snapshot.get("status");
  if (status === "queued" || status === "pending" || status === "running") {
    return documentId;
  }

  return null;
}

async function main() {
  const { loaded } = loadEnvLocal();
  if (!loaded) {
    fail(".env.local not found. Copy .env.example and add Firebase Web SDK values.");
  }

  const email = readEnv("SEED_FIREBASE_EMAIL");
  const password = readEnv("SEED_FIREBASE_PASSWORD");
  if (!email || !password) {
    fail("Set SEED_FIREBASE_EMAIL and SEED_FIREBASE_PASSWORD in your shell before running this script.");
  }

  const inputs = process.argv.slice(2).filter(Boolean);
  if (inputs.length === 0) {
    fail("Provide at least one Instagram profile URL or username.");
  }

  const config = getFirebaseConfig();
  if (!config.projectId) {
    fail("Firebase project ID is missing from .env.local");
  }

  const { profiles, skipped } = parseInstagramProfileInputs(inputs);
  if (profiles.length === 0) {
    fail("No valid Instagram profiles found in the provided input.");
  }

  const app = initializeApp(config);
  const auth = getAuth(app);
  const db = getFirestore(app);

  const credential = await signInWithEmailAndPassword(auth, email, password);
  const signedInEmail = credential.user.email ?? email;

  let queued = 0;
  let skippedActive = skipped;

  for (const profile of profiles) {
    const activeId = await findActiveQueueItem(db, profile.username);
    if (activeId) {
      skippedActive += 1;
      continue;
    }

    const record = buildQueueRecord(profile);
    const ref = doc(db, QUEUE_COLLECTION, record.id);
    await setDoc(ref, record, { merge: true });
    queued += 1;
    console.log(`Queued ${record.id}`);
  }

  console.log("");
  console.log(`projectId: ${config.projectId}`);
  console.log(`signed-in email: ${signedInEmail}`);
  console.log(`queued count: ${queued}`);
  console.log(`skipped invalid/duplicate/active count: ${skippedActive}`);
}

main().catch((error) => {
  console.error("Seed script failed:", error);
  process.exit(1);
});
