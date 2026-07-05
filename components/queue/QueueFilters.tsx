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
import {
  EXTRACTION_JOB_STATUSES,
  EXTRACTION_PLATFORMS,
  EXTRACTION_PRIORITIES,
} from "@/lib/types/queue";
import type { QueueFilterParams } from "@/lib/types/queue";
import {
  getQueuePlatformLabel,
  getQueuePriorityLabel,
  getQueueStatusLabel,
} from "@/lib/services/queueService";

interface QueueFiltersProps {
  filters: QueueFilterParams;
  onFiltersChange: (filters: QueueFilterParams) => void;
  showStatusFilter?: boolean;
}

export function QueueFilters({
  filters,
  onFiltersChange,
  showStatusFilter = true,
}: QueueFiltersProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search extraction jobs..."
          value={filters.search ?? ""}
          onChange={(event) =>
            onFiltersChange({ ...filters, search: event.target.value, page: 1 })
          }
          className="pl-8"
        />
      </div>

      {showStatusFilter ? (
        <Select
          value={filters.status ?? "all"}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              status: value as QueueFilterParams["status"],
              page: 1,
            })
          }
        >
          <SelectTrigger className="w-full lg:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {EXTRACTION_JOB_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {getQueueStatusLabel(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      <Select
        value={filters.platform ?? "all"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            platform: (value ?? "all") as QueueFilterParams["platform"],
            page: 1,
          })
        }
      >
        <SelectTrigger className="w-full lg:w-40">
          <SelectValue placeholder="Platform" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All platforms</SelectItem>
          {EXTRACTION_PLATFORMS.map((platform) => (
            <SelectItem key={platform} value={platform}>
              {getQueuePlatformLabel(platform)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.priority ?? "all"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            priority: (value ?? "all") as QueueFilterParams["priority"],
            page: 1,
          })
        }
      >
        <SelectTrigger className="w-full lg:w-36">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All priorities</SelectItem>
          {EXTRACTION_PRIORITIES.map((priority) => (
            <SelectItem key={priority} value={priority}>
              {getQueuePriorityLabel(priority)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
