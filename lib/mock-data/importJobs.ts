import type {
  ImportJob,
  ImportJobDetail,
  ImportSummary,
  ImportTimelineEvent,
  ImportTypeDefinition,
} from "@/lib/types/imports";

export const IMPORT_TYPE_DEFINITIONS: ImportTypeDefinition[] = [
  {
    type: "instagram",
    title: "Instagram Public Profiles",
    description:
      "Collect publicly available automotive profiles, bios, and follower counts from Instagram.",
    availability: "available",
  },
  {
    type: "google_places",
    title: "Google Places",
    description:
      "Import shops, detailers, wrap shops, and tuning businesses from Google Places.",
    availability: "available",
  },
  {
    type: "public_website",
    title: "Public Website",
    description:
      "Extract structured data from public automotive websites and event calendars.",
    availability: "available",
  },
  {
    type: "csv_upload",
    title: "CSV Upload",
    description:
      "Upload spreadsheet files containing businesses, profiles, or event records.",
    availability: "available",
  },
  {
    type: "manual_entry",
    title: "Manual Entry",
    description:
      "Create individual records manually for one-off discoveries and referrals.",
    availability: "available",
  },
  {
    type: "browser_extension",
    title: "Browser Extension",
    description:
      "Capture data directly from the browser while browsing automotive communities.",
    availability: "coming_soon",
    futureLabel: "Phase 3",
  },
  {
    type: "api_import",
    title: "API Import",
    description:
      "Sync records from partner feeds and external automotive data providers.",
    availability: "coming_soon",
    futureLabel: "Phase 4",
  },
];

const TODAY = "2026-07-05";

export const MOCK_IMPORT_JOBS: ImportJob[] = [
  {
    id: "imp_001",
    name: "West Coast Builders",
    type: "instagram",
    source: "instagram",
    status: "queued",
    createdBy: "collector@revit24.com",
    createdAt: `${TODAY}T21:13:00.000Z`,
    startedAt: `${TODAY}T21:14:00.000Z`,
    completedAt: null,
    duration: null,
    totalRecords: 245,
    importedRecords: 0,
    duplicateRecords: 0,
    failedRecords: 0,
  },
  {
    id: "imp_002",
    name: "SoCal Dealerships",
    type: "csv_upload",
    source: "csv",
    status: "completed",
    createdBy: "collector@revit24.com",
    createdAt: `${TODAY}T18:42:00.000Z`,
    startedAt: `${TODAY}T18:43:00.000Z`,
    completedAt: `${TODAY}T18:47:00.000Z`,
    duration: "4m 12s",
    totalRecords: 124,
    importedRecords: 118,
    duplicateRecords: 4,
    failedRecords: 2,
  },
  {
    id: "imp_003",
    name: "Wrap Shops LA",
    type: "google_places",
    source: "google_places",
    status: "failed",
    createdBy: "collector@revit24.com",
    createdAt: `${TODAY}T16:20:00.000Z`,
    startedAt: `${TODAY}T16:21:00.000Z`,
    completedAt: `${TODAY}T16:23:00.000Z`,
    duration: "2m 08s",
    totalRecords: 86,
    importedRecords: 12,
    duplicateRecords: 0,
    failedRecords: 74,
  },
  {
    id: "imp_004",
    name: "Midnight Motors Club",
    type: "manual_entry",
    source: "manual",
    status: "draft",
    createdBy: "admin@revit24.com",
    createdAt: `${TODAY}T15:05:00.000Z`,
    startedAt: null,
    completedAt: null,
    duration: null,
    totalRecords: 1,
    importedRecords: 0,
    duplicateRecords: 0,
    failedRecords: 0,
  },
  {
    id: "imp_005",
    name: "German Car Enthusiasts",
    type: "instagram",
    source: "instagram",
    status: "running",
    createdBy: "collector@revit24.com",
    createdAt: `${TODAY}T20:30:00.000Z`,
    startedAt: `${TODAY}T20:31:00.000Z`,
    completedAt: null,
    duration: null,
    totalRecords: 512,
    importedRecords: 287,
    duplicateRecords: 14,
    failedRecords: 3,
  },
  {
    id: "imp_006",
    name: "CarMeetCalendar.com",
    type: "public_website",
    source: "website",
    status: "pending_review",
    createdBy: "collector@revit24.com",
    createdAt: `${TODAY}T14:10:00.000Z`,
    startedAt: `${TODAY}T14:11:00.000Z`,
    completedAt: `${TODAY}T14:18:00.000Z`,
    duration: "7m 22s",
    totalRecords: 89,
    importedRecords: 82,
    duplicateRecords: 5,
    failedRecords: 2,
  },
  {
    id: "imp_007",
    name: "Bay Area Tuning Shops",
    type: "google_places",
    source: "google_places",
    status: "completed",
    createdBy: "reviewer@revit24.com",
    createdAt: `${TODAY}T11:00:00.000Z`,
    startedAt: `${TODAY}T11:01:00.000Z`,
    completedAt: `${TODAY}T11:06:00.000Z`,
    duration: "5m 41s",
    totalRecords: 53,
    importedRecords: 50,
    duplicateRecords: 2,
    failedRecords: 1,
  },
  {
    id: "imp_008",
    name: "Partner Feed Sync",
    type: "api_import",
    source: "api",
    status: "completed",
    createdBy: "admin@revit24.com",
    createdAt: `${TODAY}T09:30:00.000Z`,
    startedAt: `${TODAY}T09:31:00.000Z`,
    completedAt: `${TODAY}T09:38:00.000Z`,
    duration: "7m 05s",
    totalRecords: 340,
    importedRecords: 331,
    duplicateRecords: 7,
    failedRecords: 2,
  },
  {
    id: "imp_009",
    name: "Detailers NYC",
    type: "google_places",
    source: "google_places",
    status: "completed",
    createdBy: "collector@revit24.com",
    createdAt: "2026-07-04T22:15:00.000Z",
    startedAt: "2026-07-04T22:16:00.000Z",
    completedAt: "2026-07-04T22:19:00.000Z",
    duration: "3m 28s",
    totalRecords: 67,
    importedRecords: 64,
    duplicateRecords: 2,
    failedRecords: 1,
  },
  {
    id: "imp_010",
    name: "Midwest Events Q1",
    type: "csv_upload",
    source: "csv",
    status: "failed",
    createdBy: "collector@revit24.com",
    createdAt: `${TODAY}T08:45:00.000Z`,
    startedAt: `${TODAY}T08:46:00.000Z`,
    completedAt: `${TODAY}T08:47:00.000Z`,
    duration: "1m 02s",
    totalRecords: 200,
    importedRecords: 0,
    duplicateRecords: 0,
    failedRecords: 200,
  },
  {
    id: "imp_011",
    name: "JDM Culture Accounts",
    type: "instagram",
    source: "instagram",
    status: "pending_review",
    createdBy: "collector@revit24.com",
    createdAt: `${TODAY}T13:22:00.000Z`,
    startedAt: `${TODAY}T13:23:00.000Z`,
    completedAt: `${TODAY}T13:29:00.000Z`,
    duration: "6m 14s",
    totalRecords: 178,
    importedRecords: 165,
    duplicateRecords: 9,
    failedRecords: 4,
  },
  {
    id: "imp_012",
    name: "Private Collector Network",
    type: "manual_entry",
    source: "manual",
    status: "cancelled",
    createdBy: "admin@revit24.com",
    createdAt: "2026-07-03T17:00:00.000Z",
    startedAt: "2026-07-03T17:01:00.000Z",
    completedAt: "2026-07-03T17:02:00.000Z",
    duration: "0m 45s",
    totalRecords: 12,
    importedRecords: 0,
    duplicateRecords: 0,
    failedRecords: 0,
  },
];

function buildTimeline(job: ImportJob): ImportTimelineEvent[] {
  const events: ImportTimelineEvent[] = [
    {
      id: "created",
      label: "Job created",
      timestamp: job.createdAt,
      status: "completed",
    },
    {
      id: "queued",
      label: "Queued for processing",
      timestamp: job.startedAt,
      status:
        job.status === "draft"
          ? "upcoming"
          : job.status === "queued"
            ? "current"
            : "completed",
    },
    {
      id: "running",
      label: "Processing records",
      timestamp:
        job.status === "running" ? job.startedAt : job.completedAt,
      status:
        job.status === "running"
          ? "current"
          : ["completed", "failed", "pending_review", "cancelled"].includes(
                job.status,
              )
            ? job.status === "failed"
              ? "failed"
              : "completed"
            : "upcoming",
    },
    {
      id: "review",
      label: "Pending review",
      timestamp: job.status === "pending_review" ? job.completedAt : null,
      status:
        job.status === "pending_review"
          ? "current"
          : job.status === "completed"
            ? "completed"
            : "upcoming",
    },
    {
      id: "completed",
      label: "Import completed",
      timestamp: job.completedAt,
      status:
        job.status === "completed"
          ? "completed"
          : job.status === "failed" || job.status === "cancelled"
            ? "failed"
            : "upcoming",
    },
  ];

  return events;
}

export function getMockImportJobDetail(id: string): ImportJobDetail | null {
  const job = MOCK_IMPORT_JOBS.find((item) => item.id === id);
  if (!job) return null;

  return {
    ...job,
    timeline: buildTimeline(job),
  };
}

export function getMockImportSummary(): ImportSummary {
  const todayPrefix = TODAY;

  return {
    totalImports: MOCK_IMPORT_JOBS.length,
    running: MOCK_IMPORT_JOBS.filter((job) => job.status === "running").length,
    pendingReview: MOCK_IMPORT_JOBS.filter(
      (job) => job.status === "pending_review",
    ).length,
    completedToday: MOCK_IMPORT_JOBS.filter(
      (job) =>
        job.status === "completed" &&
        job.completedAt?.startsWith(todayPrefix),
    ).length,
    failedToday: MOCK_IMPORT_JOBS.filter(
      (job) =>
        job.status === "failed" && job.completedAt?.startsWith(todayPrefix),
    ).length,
  };
}
