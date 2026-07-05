"use client";

import { Button } from "@/components/ui/button";
import type { GooglePlaceRawDocument } from "@/lib/types/google-places";

interface ImportSelectionBarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onImport: () => void;
  onQueue: () => void;
  onReject: () => void;
  onMarkDuplicate: () => void;
  isLoading?: boolean;
}

export function ImportSelectionBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onImport,
  onQueue,
  onReject,
  onMarkDuplicate,
  isLoading,
}: ImportSelectionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card/95 p-4 shadow-lg backdrop-blur">
      <p className="text-sm font-medium">
        {selectedCount} of {totalCount} selected
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={onSelectAll}>
          Select All
        </Button>
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          Clear
        </Button>
        <Button variant="secondary" size="sm" onClick={onImport} disabled={isLoading}>
          Import Selected
        </Button>
        <Button variant="secondary" size="sm" onClick={onQueue} disabled={isLoading}>
          Queue Selected
        </Button>
        <Button variant="outline" size="sm" onClick={onReject} disabled={isLoading}>
          Reject Selected
        </Button>
        <Button variant="outline" size="sm" onClick={onMarkDuplicate} disabled={isLoading}>
          Mark Duplicate
        </Button>
      </div>
    </div>
  );
}

export type { GooglePlaceRawDocument };
