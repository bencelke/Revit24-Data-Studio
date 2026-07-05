"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataModeBadge, FirestoreStatusBanner } from "@/components/imports/DataModeBadge";
import { ReviewTable } from "./ReviewTable";
import { ReviewFilters } from "./ReviewFilters";
import { applyReviewRecordFilters } from "@/lib/services/reviewService";
import type { ReviewFilterParams, ReviewRecordView, ReviewSortField } from "@/lib/types/review";
import type { ImportDataMode } from "@/lib/types/import-jobs";
import { MOCK_MODE_WARNING } from "@/lib/errors/app-errors";
import { DuplicateDialog } from "./DuplicateDialog";
import { ApprovalDialog } from "./ApprovalDialog";

interface DuplicateCenterClientProps {
  initialRecords: ReviewRecordView[];
  dataMode: ImportDataMode;
  firebaseConfigured: boolean;
}

type DuplicateAction = "ignore" | "merge_later" | "approve_anyway" | "mark_duplicate";

export function DuplicateCenterClient({
  initialRecords,
  dataMode,
  firebaseConfigured,
}: DuplicateCenterClientProps) {
  const [filters, setFilters] = useState<ReviewFilterParams>({
    search: "",
    reviewStatus: "duplicate",
    importSource: "all",
    sortField: "createdAt",
    sortDirection: "desc",
    page: 1,
    pageSize: 10,
  });
  const [activeRecord, setActiveRecord] = useState<ReviewRecordView | null>(null);
  const [pendingAction, setPendingAction] = useState<DuplicateAction | null>(null);
  const [loading, setLoading] = useState(false);

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

  async function runAction(recordId: string, action: DuplicateAction, notes?: string) {
    setLoading(true);
    try {
      await fetch(`/api/review/${recordId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes }),
      });
      window.location.reload();
    } finally {
      setLoading(false);
      setActiveRecord(null);
      setPendingAction(null);
    }
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
        showStatusFilter={false}
      />

      <div className="rounded-md border border-border">
        <ReviewTable
          records={result.records}
          sortField={filters.sortField}
          sortDirection={filters.sortDirection}
          onSort={handleSort}
          sortable={false}
        />
      </div>

      {result.records.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {result.records.slice(0, 5).map((record) => (
            <div
              key={record.id}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3"
            >
              <span className="text-sm font-medium">
                {record.displayName ?? record.username ?? record.id}
              </span>
              <Button
                size="xs"
                variant="outline"
                onClick={() => runAction(record.id, "ignore")}
                disabled={loading}
              >
                Ignore
              </Button>
              <Button
                size="xs"
                variant="outline"
                onClick={() => runAction(record.id, "merge_later")}
                disabled={loading}
              >
                Merge Later
              </Button>
              <Button
                size="xs"
                variant="outline"
                onClick={() => {
                  setActiveRecord(record);
                  setPendingAction("approve_anyway");
                }}
                disabled={loading}
              >
                Approve Anyway
              </Button>
              <Button
                size="xs"
                variant="outline"
                onClick={() => {
                  setActiveRecord(record);
                  setPendingAction("mark_duplicate");
                }}
                disabled={loading}
              >
                Mark Duplicate
              </Button>
            </div>
          ))}
        </div>
      ) : null}

      {result.total === 0 ? null : (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={result.page <= 1}
            onClick={() =>
              setFilters((current) => ({
                ...current,
                page: Math.max(1, (current.page ?? 1) - 1),
              }))
            }
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {result.page} of {result.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={result.page >= result.totalPages}
            onClick={() =>
              setFilters((current) => ({
                ...current,
                page: (current.page ?? 1) + 1,
              }))
            }
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}

      {activeRecord && pendingAction === "approve_anyway" ? (
        <ApprovalDialog
          open
          onCancel={() => {
            setActiveRecord(null);
            setPendingAction(null);
          }}
          onConfirm={(notes) => runAction(activeRecord.id, "approve_anyway", notes)}
          loading={loading}
        />
      ) : null}

      {activeRecord && pendingAction === "mark_duplicate" ? (
        <DuplicateDialog
          open
          onCancel={() => {
            setActiveRecord(null);
            setPendingAction(null);
          }}
          onConfirm={(notes) => runAction(activeRecord.id, "mark_duplicate", notes)}
          loading={loading}
        />
      ) : null}
    </div>
  );
}
