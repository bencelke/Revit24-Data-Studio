"use client";

import { Button } from "@/components/ui/button";

export type ResultsFilter =
  | "all"
  | "clubs"
  | "members"
  | "unknown"
  | "success"
  | "failed";

interface ResultsFiltersProps {
  value: ResultsFilter;
  onChange: (value: ResultsFilter) => void;
}

const FILTERS: { id: ResultsFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "clubs", label: "Clubs" },
  { id: "members", label: "Members" },
  { id: "unknown", label: "Unknown" },
  { id: "success", label: "Success" },
  { id: "failed", label: "Failed" },
];

export function ResultsFilters({ value, onChange }: ResultsFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((filter) => (
        <Button
          key={filter.id}
          type="button"
          size="sm"
          variant={value === filter.id ? "default" : "outline"}
          onClick={() => onChange(filter.id)}
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
}

export function applyResultsFilter<T extends { entityType: string; status: string }>(
  rows: T[],
  filter: ResultsFilter,
): T[] {
  switch (filter) {
    case "clubs":
      return rows.filter((row) => row.entityType === "club");
    case "members":
      return rows.filter((row) => row.entityType === "member");
    case "unknown":
      return rows.filter((row) => row.entityType === "unknown");
    case "success":
      return rows.filter(
        (row) => row.status === "success" || row.status === "completed" || row.status === "mock",
      );
    case "failed":
      return rows.filter((row) => row.status === "failed");
    default:
      return rows;
  }
}
