import { startWorkerRuntimeLoop } from "./workerRuntime";

async function main() {
  console.log("[Revit24 Worker Runtime] Starting...");
  await startWorkerRuntimeLoop();
  console.log("[Revit24 Worker Runtime] Stopped.");
}

main().catch((error) => {
  console.error("[Revit24 Worker Runtime] Fatal error:", error);
  process.exit(1);
});
