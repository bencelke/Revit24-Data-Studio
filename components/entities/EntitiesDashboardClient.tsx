"use client";

import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataModeBadge, FirestoreStatusBanner } from "@/components/imports/DataModeBadge";
import { EntityCard } from "./EntityCard";
import { EntitiesSummaryCards } from "./EntitiesSummaryCards";
import type { EntitiesDashboardStats, NormalizedRecordDocument } from "@/lib/types/normalization";
import type { ImportDataMode } from "@/lib/types/import-jobs";
import { MOCK_MODE_WARNING } from "@/lib/errors/app-errors";

interface EntitiesDashboardClientProps {
  stats: EntitiesDashboardStats;
  initialRecords: NormalizedRecordDocument[];
  dataMode: ImportDataMode;
  firebaseConfigured: boolean;
}

export function EntitiesDashboardClient({
  stats,
  initialRecords,
  dataMode,
  firebaseConfigured,
}: EntitiesDashboardClientProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isRunning, setIsRunning] = useState(false);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return initialRecords.filter((record) => {
      if (statusFilter !== "all" && record.status !== statusFilter) return false;
      if (!query) return true;
      return (
        record.displayName.toLowerCase().includes(query) ||
        record.username?.toLowerCase().includes(query) ||
        record.entityType.toLowerCase().includes(query) ||
        record.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    });
  }, [initialRecords, search, statusFilter]);

  async function handleRunPipeline() {
    setIsRunning(true);
    try {
      const response = await fetch("/api/normalization/run", { method: "POST" });
      if (response.ok) {
        window.location.reload();
      }
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DataModeBadge dataMode={dataMode} firebaseConfigured={firebaseConfigured} />
        <Button
          variant="secondary"
          size="sm"
          onClick={handleRunPipeline}
          disabled={isRunning}
        >
          <RefreshCw className={`mr-2 size-4 ${isRunning ? "animate-spin" : ""}`} />
          Normalize Instagram Profiles
        </Button>
      </div>

      {!firebaseConfigured ? (
        <FirestoreStatusBanner
          variant="warning"
          title="Mock Mode"
          description={MOCK_MODE_WARNING}
        />
      ) : null}

      <EntitiesSummaryCards stats={stats} />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search entities..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="max-w-sm"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="pending_review">Pending Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="needs_edit">Needs Edit</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No normalized entities found.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((record) => (
            <EntityCard key={record.id} record={record} />
          ))}
        </div>
      )}
    </div>
  );
}
