import { getFirebaseApp } from "./app";
import { getFirebaseConfig, getMissingFirebaseEnvVars, isFirebaseConfigured } from "./config";

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
): "Connected" | "Missing" | "Error" {
  switch (status) {
    case "connected":
      return "Connected";
    case "error":
      return "Error";
    default:
      return "Missing";
  }
}

export function getFirebaseDiagnostics(): {
  status: FirebaseConnectionStatus;
  statusLabel: "Connected" | "Missing" | "Error";
  projectId: string | null;
  missingEnvVars: string[];
} {
  const status = getFirebaseConnectionStatus();
  return {
    status,
    statusLabel: formatFirebaseStatusLabel(status),
    projectId: getFirebaseProjectId(),
    missingEnvVars: getMissingFirebaseEnvVars(),
  };
}
