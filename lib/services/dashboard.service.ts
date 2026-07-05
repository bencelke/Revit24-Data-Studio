import type { DashboardData } from "@/lib/types";
import {
  getImportJobDashboardStats,
  getRecentAppLogs,
  isImportFirestoreAvailable,
} from "@/lib/services/importJobService";
import { formatRelativeTime } from "@/lib/services/importService";
import { MOCK_MODE_WARNING } from "@/lib/errors/app-errors";

const MOCK_DASHBOARD_DATA: DashboardData = {
  dataMode: "mock",
  firebaseConfigured: false,
  stats: [
    {
      id: "total-import-jobs",
      label: "Total Import Jobs",
      value: "12",
      change: "Mock data",
      trend: "neutral",
    },
    {
      id: "pending-review",
      label: "Pending Review",
      value: "2",
      change: "Mock data",
      trend: "neutral",
    },
    {
      id: "queued",
      label: "Queued",
      value: "3",
      change: "Mock data",
      trend: "neutral",
    },
    {
      id: "running",
      label: "Running",
      value: "1",
      change: "Mock data",
      trend: "neutral",
    },
    {
      id: "completed-today",
      label: "Completed Today",
      value: "4",
      change: "Mock data",
      trend: "up",
    },
    {
      id: "failed-today",
      label: "Failed Today",
      value: "1",
      change: "Mock data",
      trend: "down",
    },
  ],
  recentActivity: [
    {
      id: "1",
      action: "Import batch submitted",
      target: "Instagram profiles — Batch #284",
      actor: "system-dev",
      timestamp: "2 minutes ago",
      status: "success",
    },
    {
      id: "2",
      action: "Record approved",
      target: "Precision Auto Detailing",
      actor: "reviewer@revit24.com",
      timestamp: "14 minutes ago",
      status: "success",
    },
    {
      id: "3",
      action: "Duplicate flagged",
      target: "@midnight.motors",
      actor: "system",
      timestamp: "32 minutes ago",
      status: "warning",
    },
  ],
};

export async function getDashboardData(): Promise<DashboardData> {
  const firebaseConfigured = isImportFirestoreAvailable();

  if (!firebaseConfigured) {
    return {
      ...MOCK_DASHBOARD_DATA,
      warning: MOCK_MODE_WARNING,
    };
  }

  try {
    const stats = await getImportJobDashboardStats();
    const logs = await getRecentAppLogs(5);

    return {
      dataMode: "firestore",
      firebaseConfigured: true,
      stats: [
        {
          id: "total-import-jobs",
          label: "Total Import Jobs",
          value: String(stats.totalImportJobs),
          change: "All time",
          trend: "neutral",
        },
        {
          id: "pending-review",
          label: "Pending Review",
          value: String(stats.pendingReview),
          change: "Awaiting review",
          trend: "neutral",
        },
        {
          id: "queued",
          label: "Queued",
          value: String(stats.queued),
          change: "Ready to process",
          trend: "neutral",
        },
        {
          id: "running",
          label: "Running",
          value: String(stats.running),
          change: "In progress",
          trend: stats.running > 0 ? "up" : "neutral",
        },
        {
          id: "completed-today",
          label: "Completed Today",
          value: String(stats.completedToday),
          change: "Since midnight",
          trend: "up",
        },
        {
          id: "failed-today",
          label: "Failed Today",
          value: String(stats.failedToday),
          change: "Needs attention",
          trend: stats.failedToday > 0 ? "down" : "neutral",
        },
      ],
      recentActivity:
        logs.length > 0
          ? logs.map((log) => ({
              id: log.id,
              action: log.event,
              target: String(log.details.jobId ?? log.details.name ?? "—"),
              actor: log.user,
              timestamp: formatRelativeTime(log.timestamp),
              status:
                log.level === "error"
                  ? ("warning" as const)
                  : ("success" as const),
            }))
          : MOCK_DASHBOARD_DATA.recentActivity,
    };
  } catch {
    return {
      ...MOCK_DASHBOARD_DATA,
      dataMode: "mock",
      firebaseConfigured: false,
      warning: MOCK_MODE_WARNING,
    };
  }
}
