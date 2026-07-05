"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { DataModeBadge, FirestoreStatusBanner } from "@/components/imports/DataModeBadge";
import { DuplicateSummaryCards } from "./DuplicateSummaryCards";
import { DuplicateMatchesTable } from "./DuplicateMatchesTable";
import type {
  DuplicateFilterParams,
  DuplicateListResult,
  DuplicatesDashboardData,
  EntityMatchStatus,
  MatchReason,
} from "@/lib/types/duplicates";
import type { MatchConfidenceLevel } from "@/lib/types/normalization";
import { MOCK_MODE_WARNING } from "@/lib/errors/app-errors";

interface DuplicatesDashboardClientProps extends DuplicatesDashboardData {
  initialList: DuplicateListResult;
  defaultStatus?: EntityMatchStatus | "all";
}

export function DuplicatesDashboardClient({
  stats,
  dataMode,
  firebaseConfigured,
  warning,
  initialList,
  defaultStatus = "pending",
}: DuplicatesDashboardClientProps) {
  const router = useRouter();
  const [list, setList] = useState(initialList);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<EntityMatchStatus | "all">(defaultStatus);
  const [confidenceFilter, setConfidenceFilter] = useState<MatchConfidenceLevel | "all">("all");
  const [reasonFilter, setReasonFilter] = useState<MatchReason | "all">("all");
  const [page, setPage] = useState(initialList.page);

  const fetchList = useCallback(
    async (params: DuplicateFilterParams) => {
      const query = new URLSearchParams();
      if (params.search) query.set("search", params.search);
      if (params.status && params.status !== "all") query.set("status", params.status);
      if (params.confidence && params.confidence !== "all") query.set("confidence", params.confidence);
      if (params.reason && params.reason !== "all") query.set("reason", params.reason);
      if (params.page) query.set("page", String(params.page));

      const response = await fetch(`/api/duplicates?${query.toString()}`);
      if (response.ok) {
        const data = (await response.json()) as DuplicateListResult;
        setList(data);
      }
    },
    [],
  );

  const filters = useMemo(
    () => ({ search, status: statusFilter, confidence: confidenceFilter, reason: reasonFilter, page }),
    [search, statusFilter, confidenceFilter, reasonFilter, page],
  );

  function applyFilters(next: Partial<DuplicateFilterParams>) {
    const params = { ...filters, ...next };
    void fetchList(params);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DataModeBadge dataMode={dataMode} firebaseConfigured={firebaseConfigured} />
      </div>
      {!firebaseConfigured ? (
        <FirestoreStatusBanner variant="warning" title="Mock Mode" description={MOCK_MODE_WARNING} />
      ) : warning ? (
        <FirestoreStatusBanner variant="warning" title="Mock Data" description={warning} />
      ) : null}

      <DuplicateSummaryCards stats={stats} />

      <DuplicateMatchesTable
        matches={list.matches}
        total={list.total}
        page={list.page}
        totalPages={list.totalPages}
        onPageChange={(p) => {
          setPage(p);
          applyFilters({ page: p });
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={(s) => {
          setStatusFilter(s);
          setPage(1);
          applyFilters({ status: s, page: 1 });
        }}
        confidenceFilter={confidenceFilter}
        onConfidenceFilterChange={(c) => {
          setConfidenceFilter(c);
          setPage(1);
          applyFilters({ confidence: c, page: 1 });
        }}
        reasonFilter={reasonFilter}
        onReasonFilterChange={(r) => {
          setReasonFilter(r);
          setPage(1);
          applyFilters({ reason: r, page: 1 });
        }}
        search={search}
        onSearchChange={(s) => {
          setSearch(s);
          setPage(1);
          applyFilters({ search: s, page: 1 });
        }}
      />
    </div>
  );
}
