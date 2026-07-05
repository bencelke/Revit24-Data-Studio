"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataModeBadge, FirestoreStatusBanner } from "@/components/imports/DataModeBadge";
import { ReviewFilters } from "./ReviewFilters";
import { ReviewTable } from "./ReviewTable";
import { ReviewSummaryCards } from "./ReviewSummaryCards";
import { ReviewActivityPanel } from "./ReviewActivityPanel";
import { applyReviewRecordFilters } from "@/lib/services/reviewService";
import type {
  ReviewActivityItem,
  ReviewDashboardStats,
  ReviewFilterParams,
  ReviewRecordView,
  ReviewSortField,
} from "@/lib/types/review";
import type { ImportDataMode } from "@/lib/types/import-jobs";
import { MOCK_MODE_WARNING } from "@/lib/errors/app-errors";

interface ReviewDashboardClientProps {
  stats: ReviewDashboardStats;
  initialRecords: ReviewRecordView[];
  recentActivity: ReviewActivityItem[];
  dataMode: ImportDataMode;
  firebaseConfigured: boolean;
}

export function ReviewDashboardClient({
  stats,
  initialRecords,
  recentActivity,
  dataMode,
  firebaseConfigured,
}: ReviewDashboardClientProps) {
  const [filters, setFilters] = useState<ReviewFilterParams>({
    search: "",
    reviewStatus: "pending_review",
    importSource: "all",
    sortField: "createdAt",
    sortDirection: "desc",
    page: 1,
    pageSize: 10,
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const result = useMemo(
    () => applyReviewRecordFilters(initialRecords, filters),
    [initialRecords, filters],
  );

  function handleSort(field: ReviewSortField) {
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

      <ReviewSummaryCards stats={stats} />

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <ReviewFilters filters={filters} onFiltersChange={setFilters} />
          <ReviewTable
            records={result.records}
            sortField={filters.sortField}
            sortDirection={filters.sortDirection}
            onSort={handleSort}
            selectable
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
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

        <ReviewActivityPanel activity={recentActivity} />
      </div>
    </div>
  );
}

interface ReviewListClientProps {
  initialRecords: ReviewRecordView[];
  dataMode: ImportDataMode;
  firebaseConfigured: boolean;
  defaultStatus?: ReviewFilterParams["reviewStatus"];
  showStatusFilter?: boolean;
  title?: string;
}

export function ReviewListClient({
  initialRecords,
  dataMode,
  firebaseConfigured,
  defaultStatus = "all",
  showStatusFilter = true,
}: ReviewListClientProps) {
  const [filters, setFilters] = useState<ReviewFilterParams>({
    search: "",
    reviewStatus: defaultStatus,
    importSource: "all",
    sortField: "createdAt",
    sortDirection: "desc",
    page: 1,
    pageSize: 10,
  });

  const result = useMemo(
    () => applyReviewRecordFilters(initialRecords, filters),
    [initialRecords, filters],
  );

  function handleSort(field: ReviewSortField) {
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

      <ReviewFilters
        filters={filters}
        onFiltersChange={setFilters}
        showStatusFilter={showStatusFilter}
      />
      <ReviewTable
        records={result.records}
        sortField={filters.sortField}
        sortDirection={filters.sortDirection}
        onSort={handleSort}
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
        records
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
