"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataModeBadge, FirestoreStatusBanner } from "@/components/imports/DataModeBadge";
import { QueueSummaryCards } from "./QueueSummaryCards";
import { QueueFilters } from "./QueueFilters";
import { QueueTable } from "./QueueTable";
import { applyQueueJobFilters } from "@/lib/services/queueService";
import type {
  ExtractionPriority,
  QueueDashboardStats,
  QueueFilterParams,
  QueueJobView,
  QueueSortField,
} from "@/lib/types/queue";
import type { ImportDataMode } from "@/lib/types/import-jobs";
import { MOCK_MODE_WARNING } from "@/lib/errors/app-errors";

interface QueueDashboardClientProps {
  stats: QueueDashboardStats;
  initialJobs: QueueJobView[];
  dataMode: ImportDataMode;
  firebaseConfigured: boolean;
}

export function QueueDashboardClient({
  stats,
  initialJobs,
  dataMode,
  firebaseConfigured,
}: QueueDashboardClientProps) {
  const router = useRouter();
  const [filters, setFilters] = useState<QueueFilterParams>({
    search: "",
    status: "all",
    platform: "all",
    priority: "all",
    sortField: "createdAt",
    sortDirection: "desc",
    page: 1,
    pageSize: 10,
  });

  const result = useMemo(
    () => applyQueueJobFilters(initialJobs, filters),
    [initialJobs, filters],
  );

  function handleSort(field: QueueSortField) {
    setFilters((current) => ({
      ...current,
      sortField: field,
      sortDirection:
        current.sortField === field && current.sortDirection === "desc"
          ? "asc"
          : "desc",
      page: 1,
    }));
  }

  async function handleAction(
    jobId: string,
    action: string,
    priority?: ExtractionPriority,
  ) {
    await fetch(`/api/queue/${jobId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, priority }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DataModeBadge dataMode={dataMode} firebaseConfigured={firebaseConfigured} />
      </div>

      {!firebaseConfigured ? (
        <FirestoreStatusBanner
          variant="warning"
          title="Mock Mode"
          description={MOCK_MODE_WARNING}
        />
      ) : null}

      <QueueSummaryCards stats={stats} />
      <QueueFilters filters={filters} onFiltersChange={setFilters} />
      <QueueTable
        jobs={result.jobs}
        sortField={filters.sortField}
        sortDirection={filters.sortDirection}
        onSort={handleSort}
        onAction={handleAction}
      />

      {result.total === 0 ? null : (
        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          total={result.total}
          pageSize={result.pageSize}
          onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
        />
      )}
    </div>
  );
}

interface QueueHistoryClientProps {
  initialJobs: QueueJobView[];
  dataMode: ImportDataMode;
  firebaseConfigured: boolean;
}

export function QueueHistoryClient({
  initialJobs,
  dataMode,
  firebaseConfigured,
}: QueueHistoryClientProps) {
  const [filters, setFilters] = useState<QueueFilterParams>({
    search: "",
    status: "all",
    platform: "all",
    priority: "all",
    sortField: "createdAt",
    sortDirection: "desc",
    page: 1,
    pageSize: 10,
  });

  const historyJobs = useMemo(
    () =>
      initialJobs.filter((job) =>
        ["completed", "failed", "cancelled"].includes(job.status),
      ),
    [initialJobs],
  );

  const result = useMemo(
    () => applyQueueJobFilters(historyJobs, filters),
    [historyJobs, filters],
  );

  function handleSort(field: QueueSortField) {
    setFilters((current) => ({
      ...current,
      sortField: field,
      sortDirection:
        current.sortField === field && current.sortDirection === "desc"
          ? "asc"
          : "desc",
      page: 1,
    }));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DataModeBadge dataMode={dataMode} firebaseConfigured={firebaseConfigured} />
      </div>

      {!firebaseConfigured ? (
        <FirestoreStatusBanner
          variant="warning"
          title="Mock Mode"
          description={MOCK_MODE_WARNING}
        />
      ) : null}

      <QueueFilters filters={filters} onFiltersChange={setFilters} />
      <QueueTable
        jobs={result.jobs}
        sortField={filters.sortField}
        sortDirection={filters.sortDirection}
        onSort={handleSort}
        sortable
      />

      {result.total === 0 ? null : (
        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          total={result.total}
          pageSize={result.pageSize}
          onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
        />
      )}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}{" "}
        jobs
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          <ChevronLeft className="size-4" />
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
