"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PlacesResultsTable } from "./PlacesResultsTable";
import { ImportSelectionBar } from "./ImportSelectionBar";
import { BusinessCard } from "./BusinessCard";
import type { GooglePlaceRawDocument, PlacesSearchJobDocument } from "@/lib/types/google-places";

interface GooglePlacesResultsClientProps {
  job: PlacesSearchJobDocument;
  places: GooglePlaceRawDocument[];
}

export function GooglePlacesResultsClient({ job, places }: GooglePlacesResultsClientProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<"table" | "cards">("table");

  async function runBulkAction(action: "import" | "queue" | "reject" | "duplicate") {
    setIsLoading(true);
    try {
      await fetch("/api/google-places/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeIds: [...selectedIds], action }),
      });
      setSelectedIds(new Set());
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Search Results</h2>
          <p className="text-sm text-muted-foreground">
            {job.totalResults} businesses · {job.query.city}, {job.query.country}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className={`rounded-md px-3 py-1.5 text-sm ${view === "table" ? "bg-brand text-white" : "bg-muted"}`}
            onClick={() => setView("table")}
          >
            Table
          </button>
          <button
            type="button"
            className={`rounded-md px-3 py-1.5 text-sm ${view === "cards" ? "bg-brand text-white" : "bg-muted"}`}
            onClick={() => setView("cards")}
          >
            Cards
          </button>
        </div>
      </div>

      {view === "table" ? (
        <PlacesResultsTable
          places={places}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {places.map((place) => (
            <BusinessCard
              key={place.id}
              place={place}
              selected={selectedIds.has(place.id)}
              onToggleSelect={(id) => {
                const next = new Set(selectedIds);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                setSelectedIds(next);
              }}
            />
          ))}
        </div>
      )}

      <ImportSelectionBar
        selectedCount={selectedIds.size}
        totalCount={places.length}
        onSelectAll={() => setSelectedIds(new Set(places.map((place) => place.id)))}
        onClearSelection={() => setSelectedIds(new Set())}
        onImport={() => void runBulkAction("import")}
        onQueue={() => void runBulkAction("queue")}
        onReject={() => void runBulkAction("reject")}
        onMarkDuplicate={() => void runBulkAction("duplicate")}
        isLoading={isLoading}
      />
    </div>
  );
}
