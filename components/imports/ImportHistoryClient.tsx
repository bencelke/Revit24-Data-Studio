"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImportFilters } from "./ImportFilters";
import { ImportTable } from "./ImportTable";
import { DataModeBadge, FirestoreStatusBanner } from "./DataModeBadge";
import { applyImportJobFilters } from "@/lib/services/importService";
import type { ImportFilterParams, ImportJob, ImportSortField } from "@/lib/types/imports";
import type { ImportDataMode } from "@/lib/types/instagram-imports";

interface ImportHistoryClientProps {
  initialJobs: ImportJob[];
  dataMode: ImportDataMode;
  firebaseConfigured: boolean;
}

export function ImportHistoryClient({
  initialJobs,
  dataMode,
  firebaseConfigured,
}: ImportHistoryClientProps) {
  const [filters, setFilters] = useState<ImportFilterParams>({
    search: "",
    status: "all",
    source: "all",
    sortField: "createdAt",
    sortDirection: "desc",
    page: 1,
    pageSize: 10,
  });

  const result = useMemo(
    () => applyImportJobFilters(initialJobs, filters),
    [initialJobs, filters],
  );

  function handleSort(field: ImportSortField) {
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
        <DataModeBadge
          dataMode={dataMode}
          firebaseConfigured={firebaseConfigured}
        />
      </div>

      {!firebaseConfigured ? (
        <FirestoreStatusBanner
          variant="warning"
          title="Firestore Not Configured"
          description="Showing mock import history. Configure Firebase environment variables in .env.local to persist and view live import jobs."
        />
      ) : null}

      <ImportFilters filters={filters} onFiltersChange={setFilters} />

      <ImportTable
        jobs={result.jobs}
        sortField={filters.sortField}
        sortDirection={filters.sortDirection}
        onSort={handleSort}
      />

      {result.total === 0 ? null : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(result.page - 1) * result.pageSize + 1}–
            {Math.min(result.page * result.pageSize, result.total)} of{" "}
            {result.total} imports
          </p>

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
        </div>
      )}
    </div>
  );
}

export function ImportPageNav({
  active,
}: {
  active: "overview" | "new" | "history" | "discovery";
}) {
  const links = [
    { href: "/imports", label: "Overview", key: "overview" as const },
    { href: "/imports/new", label: "New Import", key: "new" as const },
    { href: "/imports/history", label: "History", key: "history" as const },
    { href: "/imports/discovery", label: "Discovery", key: "discovery" as const },
  ];

  return (
    <nav className="flex flex-wrap gap-2 border-b border-border pb-4">
      {links.map((link) => (
        <Button
          key={link.key}
          variant={active === link.key ? "secondary" : "ghost"}
          size="sm"
          nativeButton={false}
          render={<Link href={link.href} />}
        >
          {link.label}
        </Button>
      ))}
    </nav>
  );
}
