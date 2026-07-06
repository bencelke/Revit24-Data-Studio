import { getFirebaseApp } from "./app";
import { getFirebaseConfig, isFirebaseConfigured } from "./config";

export type FirebaseConnectionStatus = "connected" | "missing_config" | "error";

export function getFirebaseConnectionStatus(): FirebaseConnectionStatus {
  if (!isFirebaseConfigured()) {
    return "missing_config";
  }

  try {
    return getFirebaseApp() ? "connected" : "missing_config";
  } catch {
    return "error";
  }
}

export function getFirebaseProjectId(): string | null {
  const projectId = getFirebaseConfig().projectId.trim();
  return projectId.length > 0 ? projectId : null;
}

export function formatFirebaseStatusLabel(
  status: FirebaseConnectionStatus,
): "Connected" | "Missing Config" | "Error" {
  switch (status) {
    case "connected":
      return "Connected";
    case "error":
      return "Error";
    default:
      return "Missing Config";
  }
}
