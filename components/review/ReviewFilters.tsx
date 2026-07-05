"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { REVIEW_RECORD_STATUSES } from "@/lib/types/review";
import type { ReviewFilterParams } from "@/lib/types/review";
import {
  getReviewImportSourceLabel,
  getReviewStatusLabel,
} from "@/lib/services/reviewService";

const IMPORT_SOURCES = ["instagram", "google_places", "website", "manual"] as const;

interface ReviewFiltersProps {
  filters: ReviewFilterParams;
  onFiltersChange: (filters: ReviewFilterParams) => void;
  showStatusFilter?: boolean;
  statusOptions?: typeof REVIEW_RECORD_STATUSES;
}

export function ReviewFilters({
  filters,
  onFiltersChange,
  showStatusFilter = true,
  statusOptions = REVIEW_RECORD_STATUSES,
}: ReviewFiltersProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search records..."
          value={filters.search ?? ""}
          onChange={(event) =>
            onFiltersChange({ ...filters, search: event.target.value, page: 1 })
          }
          className="pl-8"
        />
      </div>

      {showStatusFilter ? (
        <Select
          value={filters.reviewStatus ?? "all"}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              reviewStatus: value as ReviewFilterParams["reviewStatus"],
              page: 1,
            })
          }
        >
          <SelectTrigger className="w-full lg:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {statusOptions.map((status) => (
              <SelectItem key={status} value={status}>
                {getReviewStatusLabel(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      <Select
        value={filters.importSource ?? "all"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            importSource: value ?? "all",
            page: 1,
          })
        }
      >
        <SelectTrigger className="w-full lg:w-44">
          <SelectValue placeholder="Source" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All sources</SelectItem>
          {IMPORT_SOURCES.map((source) => (
            <SelectItem key={source} value={source}>
              {getReviewImportSourceLabel(source)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
