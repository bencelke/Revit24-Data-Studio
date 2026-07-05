"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataModeBadge, FirestoreStatusBanner } from "@/components/imports/DataModeBadge";
import { WorkerCard } from "./WorkerCard";
import { WorkerTable } from "./WorkerTable";
import { WorkerLogsTable } from "./WorkerLogsTable";
import { applyWorkerLogsFilters } from "@/lib/services/workerService";
import type { WorkerDocument, WorkerLogDocument, WorkerLogLevel } from "@/lib/types/workers";
import type { ImportDataMode } from "@/lib/types/import-jobs";
import { MOCK_MODE_WARNING } from "@/lib/errors/app-errors";

interface WorkersClientProps {
  workers: WorkerDocument[];
  dataMode: ImportDataMode;
  firebaseConfigured: boolean;
}

export function WorkersClient({
  workers,
  dataMode,
  firebaseConfigured,
}: WorkersClientProps) {
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {workers.map((worker) => (
          <WorkerCard key={worker.id} worker={worker} />
        ))}
      </div>

      <WorkerTable workers={workers} />
    </div>
  );
}

interface WorkerLogsClientProps {
  initialLogs: WorkerLogDocument[];
  workers: WorkerDocument[];
  dataMode: ImportDataMode;
  firebaseConfigured: boolean;
}

export function WorkerLogsClient({
  initialLogs,
  workers,
  dataMode,
  firebaseConfigured,
}: WorkerLogsClientProps) {
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<WorkerLogLevel | "all">("all");
  const [workerId, setWorkerId] = useState<string | "all">("all");
  const [page, setPage] = useState(1);

  const result = useMemo(
    () =>
      applyWorkerLogsFilters(initialLogs, {
        search,
        level,
        workerId,
        page,
        pageSize: 15,
      }),
    [initialLogs, search, level, workerId, page],
  );

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

      <WorkerLogsTable
        logs={result.logs}
        workers={workers}
        search={search}
        level={level}
        workerId={workerId}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        onLevelChange={(value) => {
          setLevel(value);
          setPage(1);
        }}
        onWorkerChange={(value) => {
          setWorkerId(value);
          setPage(1);
        }}
      />

      {result.total === 0 ? null : (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={result.page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
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
            onClick={() => setPage((current) => current + 1)}
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
