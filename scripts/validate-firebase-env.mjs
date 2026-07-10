#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { loadEnvLocal, readEnv } from "./lib/load-env-local.mjs";

const REQUIRED_ENV_KEYS = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
];

const FORBIDDEN_PATTERNS = [
  /private_key/i,
  /service_account/i,
  /firebase-admin/i,
  /FIREBASE_CLIENT_EMAIL/i,
  /FIREBASE_PRIVATE_KEY/i,
  /client_email/i,
];

const EXPECTED_PROJECT_ID = "carradar-bd6fb";
const EXPECTED_AUTH_DOMAIN = "carradar-bd6fb.firebaseapp.com";

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function pass(message) {
  console.log(`OK: ${message}`);
}

function main() {
  const cwd = process.cwd();
  const envPath = path.join(cwd, ".env.local");

  console.log(`Project root: ${cwd}`);

  if (!fs.existsSync(envPath)) {
    fail(".env.local was not found. Copy .env.example to .env.local and add Firebase Web SDK values.");
  }

  pass(".env.local exists");

  const envContent = fs.readFileSync(envPath, "utf8");
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(envContent)) {
      fail(`Forbidden credential pattern detected in .env.local: ${pattern}`);
    }
  }
  pass("No service account / private_key / firebase-admin values in .env.local");

  loadEnvLocal(cwd);

  const missing = REQUIRED_ENV_KEYS.filter((key) => readEnv(key).length === 0);
  if (missing.length > 0) {
    fail(`Missing required env vars: ${missing.join(", ")}`);
  }
  pass("All required NEXT_PUBLIC_FIREBASE_* values are present");

  if (!readEnv("NEXT_PUBLIC_FIREBASE_API_KEY")) {
    fail("NEXT_PUBLIC_FIREBASE_API_KEY is empty");
  }

  const projectId = readEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  if (projectId !== EXPECTED_PROJECT_ID) {
    fail(
      `NEXT_PUBLIC_FIREBASE_PROJECT_ID must be ${EXPECTED_PROJECT_ID}, got "${projectId || "empty"}"`,
    );
  }

  const authDomain = readEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
  if (authDomain !== EXPECTED_AUTH_DOMAIN) {
    fail(
      `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN must be ${EXPECTED_AUTH_DOMAIN}, got "${authDomain || "empty"}"`,
    );
  }

  console.log("");
  console.log("Firebase env validation passed");
  console.log(`projectId: ${projectId}`);
  console.log(`authDomain: ${authDomain}`);
  console.log("apiKey: [hidden]");
}

main();
