import type { DashboardData } from "@/lib/types";
import {
  getRecentAppLogs,
  isImportFirestoreAvailable,
} from "@/lib/services/importJobService";
import { formatRelativeTime } from "@/lib/services/importService";
import { getPipelineDashboardStats } from "@/lib/services/normalizationPipeline";
import { MOCK_MODE_WARNING } from "@/lib/errors/app-errors";

const MOCK_PIPELINE_STATS = {
  rawImports: 12,
  extractionJobs: 5,
  normalizedRecords: 4,
  pendingReview: 4,
  approved: 2,
};

const MOCK_DASHBOARD_DATA: DashboardData = {
  dataMode: "mock",
  firebaseConfigured: false,
  stats: [
    {
      id: "raw-imports",
      label: "Raw Imports",
      value: String(MOCK_PIPELINE_STATS.rawImports),
      change: "Mock data",
      trend: "neutral",
    },
    {
      id: "extraction-jobs",
      label: "Extraction Jobs",
      value: String(MOCK_PIPELINE_STATS.extractionJobs),
      change: "Mock data",
      trend: "neutral",
    },
    {
      id: "normalized-records",
      label: "Normalized Records",
      value: String(MOCK_PIPELINE_STATS.normalizedRecords),
      change: "Mock data",
      trend: "neutral",
    },
    {
      id: "pending-review",
      label: "Pending Review",
      value: String(MOCK_PIPELINE_STATS.pendingReview),
      change: "Mock data",
      trend: "neutral",
    },
    {
      id: "approved",
      label: "Approved",
      value: String(MOCK_PIPELINE_STATS.approved),
      change: "Mock data",
      trend: "up",
    },
  ],
  recentActivity: [
    {
      id: "1",
      action: "Entity normalized",
      target: "BMW Club Stuttgart",
      actor: "normalization-pipeline",
      timestamp: "2 minutes ago",
      status: "success",
    },
    {
      id: "2",
      action: "Matches detected",
      target: "Precision Auto Detailing",
      actor: "entity-matching",
      timestamp: "14 minutes ago",
      status: "warning",
    },
    {
      id: "3",
      action: "Record approved",
      target: "Euro Drift Collective",
      actor: "reviewer@revit24.com",
      timestamp: "32 minutes ago",
      status: "success",
    },
  ],
};

function buildStatsFromPipeline(pipeline: {
  rawImports: number;
  extractionJobs: number;
  normalizedRecords: number;
  pendingReview: number;
  approved: number;
}) {
  return [
    {
      id: "raw-imports",
      label: "Raw Imports",
      value: String(pipeline.rawImports),
      change: "All import jobs",
      trend: "neutral" as const,
    },
    {
      id: "extraction-jobs",
      label: "Extraction Jobs",
      value: String(pipeline.extractionJobs),
      change: "Queue jobs",
      trend: "neutral" as const,
    },
    {
      id: "normalized-records",
      label: "Normalized Records",
      value: String(pipeline.normalizedRecords),
      change: "Structured entities",
      trend: "neutral" as const,
    },
    {
      id: "pending-review",
      label: "Pending Review",
      value: String(pipeline.pendingReview),
      change: "Awaiting approval",
      trend: pipeline.pendingReview > 0 ? ("up" as const) : ("neutral" as const),
    },
    {
      id: "approved",
      label: "Approved",
      value: String(pipeline.approved),
      change: "Ready for ShiftIt",
      trend: "up" as const,
    },
  ];
}

export async function getDashboardData(): Promise<DashboardData> {
  const firebaseConfigured = isImportFirestoreAvailable();

  try {
    const pipeline = await getPipelineDashboardStats();
    const logs = firebaseConfigured ? await getRecentAppLogs(5).catch(() => []) : [];

    return {
      dataMode: firebaseConfigured ? "firestore" : "mock",
      firebaseConfigured,
      stats: buildStatsFromPipeline(pipeline),
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
      warning: firebaseConfigured ? undefined : MOCK_MODE_WARNING,
    };
  } catch {
    return {
      ...MOCK_DASHBOARD_DATA,
      warning: MOCK_MODE_WARNING,
    };
  }
}
