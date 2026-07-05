import {
  getMockImportJobDetail,
  getMockImportSummary,
  IMPORT_TYPE_DEFINITIONS,
  MOCK_IMPORT_JOBS,
} from "@/lib/mock-data/importJobs";
import type {
  ImportFilterParams,
  ImportJob,
  ImportJobDetail,
  ImportListResult,
  ImportSortField,
  ImportSummary,
  ImportTypeDefinition,
} from "@/lib/types/imports";

const DEFAULT_PAGE_SIZE = 10;

function compareValues(
  a: string | number,
  b: string | number,
  direction: "asc" | "desc",
): number {
  if (a === b) return 0;
  const result = a < b ? -1 : 1;
  return direction === "asc" ? result : -result;
}

function sortJobs(
  jobs: ImportJob[],
  sortField: ImportSortField,
  sortDirection: "asc" | "desc",
): ImportJob[] {
  return [...jobs].sort((a, b) => {
    switch (sortField) {
      case "name":
        return compareValues(a.name, b.name, sortDirection);
      case "source":
        return compareValues(a.source, b.source, sortDirection);
      case "type":
        return compareValues(a.type, b.type, sortDirection);
      case "status":
        return compareValues(a.status, b.status, sortDirection);
      case "totalRecords":
        return compareValues(a.totalRecords, b.totalRecords, sortDirection);
      case "duration":
        return compareValues(a.duration ?? "", b.duration ?? "", sortDirection);
      case "createdAt":
      default:
        return compareValues(a.createdAt, b.createdAt, sortDirection);
    }
  });
}

function filterJobs(jobs: ImportJob[], params: ImportFilterParams): ImportJob[] {
  const search = params.search?.trim().toLowerCase() ?? "";

  return jobs.filter((job) => {
    const matchesSearch =
      search.length === 0 ||
      job.name.toLowerCase().includes(search) ||
      job.createdBy.toLowerCase().includes(search) ||
      job.source.toLowerCase().includes(search);

    const matchesStatus =
      !params.status || params.status === "all" || job.status === params.status;

    const matchesSource =
      !params.source || params.source === "all" || job.source === params.source;

    return matchesSearch && matchesStatus && matchesSource;
  });
}

export function getImportTypeDefinitions(): ImportTypeDefinition[] {
  return IMPORT_TYPE_DEFINITIONS;
}

export function getImportSummary(): ImportSummary {
  return getMockImportSummary();
}

export function getRecentImportJobs(limit = 6): ImportJob[] {
  return sortJobs(MOCK_IMPORT_JOBS, "createdAt", "desc").slice(0, limit);
}

export function getImportJobs(
  params: ImportFilterParams = {},
): ImportListResult {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const sortField = params.sortField ?? "createdAt";
  const sortDirection = params.sortDirection ?? "desc";

  const filtered = filterJobs(MOCK_IMPORT_JOBS, params);
  const sorted = sortJobs(filtered, sortField, sortDirection);
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    jobs: sorted.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

export function getImportJobById(id: string): ImportJobDetail | null {
  return getMockImportJobDetail(id);
}

export function formatImportDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(isoDate));
}

export function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function getImportSourceLabel(source: ImportJob["source"]): string {
  const labels: Record<ImportJob["source"], string> = {
    instagram: "Instagram",
    google_places: "Google Places",
    website: "Public Website",
    csv: "CSV Upload",
    manual: "Manual Entry",
    browser_extension: "Browser Extension",
    api: "API Import",
  };

  return labels[source];
}

export function getImportTypeLabel(type: ImportJob["type"]): string {
  const definition = IMPORT_TYPE_DEFINITIONS.find((item) => item.type === type);
  return definition?.title ?? type;
}

export function getImportStatusLabel(status: ImportJob["status"]): string {
  const labels: Record<ImportJob["status"], string> = {
    draft: "Draft",
    queued: "Queued",
    running: "Running",
    completed: "Completed",
    failed: "Failed",
    cancelled: "Cancelled",
    pending_review: "Pending Review",
  };

  return labels[status];
}
