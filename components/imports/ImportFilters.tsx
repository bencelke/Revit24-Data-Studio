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
import { IMPORT_SOURCES, IMPORT_STATUSES } from "@/lib/types/imports";
import type { ImportFilterParams } from "@/lib/types/imports";
import { getImportSourceLabel, getImportStatusLabel } from "@/lib/services/importService";

interface ImportFiltersProps {
  filters: ImportFilterParams;
  onFiltersChange: (filters: ImportFilterParams) => void;
}

export function ImportFilters({ filters, onFiltersChange }: ImportFiltersProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search imports..."
          value={filters.search ?? ""}
          onChange={(event) =>
            onFiltersChange({ ...filters, search: event.target.value, page: 1 })
          }
          className="pl-8"
        />
      </div>

      <Select
        value={filters.status ?? "all"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            status: value as ImportFilterParams["status"],
            page: 1,
          })
        }
      >
        <SelectTrigger className="w-full lg:w-44">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {IMPORT_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {getImportStatusLabel(status)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.source ?? "all"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            source: value as ImportFilterParams["source"],
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
              {getImportSourceLabel(source)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
