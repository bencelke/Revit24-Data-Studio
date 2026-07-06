import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInstagramWorkerUntilEmpty } from "@/lib/services/instagramWorkerService";

function loadEnvFile(filename: string): void {
  const path = resolve(process.cwd(), filename);
  if (!existsSync(path)) {
    return;
  }

  const content = readFileSync(path, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function main(): Promise<void> {
  loadEnvFile(".env.local");
  loadEnvFile(".env");

  if (!process.env.ENABLE_INSTAGRAM_EXTRACTION) {
    process.env.ENABLE_INSTAGRAM_EXTRACTION = "true";
  }

  if (process.env.INSTAGRAM_WORKER_TIMEOUT_MS && !process.env.INSTAGRAM_EXTRACTION_TIMEOUT_MS) {
    process.env.INSTAGRAM_EXTRACTION_TIMEOUT_MS = process.env.INSTAGRAM_WORKER_TIMEOUT_MS;
  }

  console.log("Revit24 Instagram extraction worker starting...");
  console.log(`Firebase project: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "not set"}`);

  const summary = await runInstagramWorkerUntilEmpty();

  console.log("Worker finished.");
  console.log(
    `Processed: ${summary.processed} · Succeeded: ${summary.succeeded} · Failed: ${summary.failed} · Remaining: ${summary.remaining}`,
  );

  if (summary.remaining > 0) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Worker failed.";
  console.error(message);
  process.exitCode = 1;
});
