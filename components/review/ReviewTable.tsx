"use client";

import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, User } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ReviewStatusBadge } from "./ReviewStatusBadge";
import { EmptyState } from "@/components/imports/EmptyState";
import {
  formatReviewDate,
  getReviewImportSourceLabel,
} from "@/lib/services/reviewService";
import type {
  ReviewRecordView,
  ReviewSortDirection,
  ReviewSortField,
} from "@/lib/types/review";
import { cn } from "@/lib/utils";

interface ReviewTableProps {
  records: ReviewRecordView[];
  sortField?: ReviewSortField;
  sortDirection?: ReviewSortDirection;
  onSort?: (field: ReviewSortField) => void;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  sortable?: boolean;
}

function SortButton({
  label,
  field,
  sortField,
  sortDirection,
  onSort,
}: {
  label: string;
  field: ReviewSortField;
  sortField?: ReviewSortField;
  sortDirection?: ReviewSortDirection;
  onSort?: (field: ReviewSortField) => void;
}) {
  const isActive = sortField === field;
  const Icon = !isActive
    ? ArrowUpDown
    : sortDirection === "asc"
      ? ArrowUp
      : ArrowDown;

  return (
    <button
      type="button"
      onClick={() => onSort?.(field)}
      className="inline-flex items-center gap-1 text-left font-medium hover:text-foreground"
    >
      {label}
      <Icon
        className={cn(
          "size-3.5",
          isActive ? "text-brand" : "text-muted-foreground",
        )}
        aria-hidden
      />
    </button>
  );
}

export function ReviewTable({
  records,
  sortField,
  sortDirection,
  onSort,
  selectable = false,
  selectedIds = new Set(),
  onSelectionChange,
  sortable = true,
}: ReviewTableProps) {
  if (records.length === 0) {
    return (
      <EmptyState
        title="No records found"
        description="Try adjusting your search or filters to find review records."
      />
    );
  }

  const allSelected =
    records.length > 0 && records.every((record) => selectedIds.has(record.id));

  function toggleAll() {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(records.map((record) => record.id)));
    }
  }

  function toggleOne(id: string) {
    if (!onSelectionChange) return;
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  }

  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {selectable ? (
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  role="checkbox"
                  aria-label="Select all records"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="size-4 rounded border-border accent-brand"
                />
              </TableHead>
            ) : null}
            <TableHead className="w-12">Profile</TableHead>
            <TableHead>
              {sortable ? (
                <SortButton
                  label="Username"
                  field="username"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={onSort}
                />
              ) : (
                "Username"
              )}
            </TableHead>
            <TableHead>
              {sortable ? (
                <SortButton
                  label="Display Name"
                  field="displayName"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={onSort}
                />
              ) : (
                "Display Name"
              )}
            </TableHead>
            <TableHead>
              {sortable ? (
                <SortButton
                  label="Source"
                  field="importSource"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={onSort}
                />
              ) : (
                "Import Source"
              )}
            </TableHead>
            <TableHead>
              {sortable ? (
                <SortButton
                  label="Import Job"
                  field="jobName"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={onSort}
                />
              ) : (
                "Import Job"
              )}
            </TableHead>
            <TableHead>
              {sortable ? (
                <SortButton
                  label="Status"
                  field="reviewStatus"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={onSort}
                />
              ) : (
                "Status"
              )}
            </TableHead>
            <TableHead>
              {sortable ? (
                <SortButton
                  label="Created"
                  field="createdAt"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={onSort}
                />
              ) : (
                "Created"
              )}
            </TableHead>
            <TableHead>
              {sortable ? (
                <SortButton
                  label="Reviewer"
                  field="reviewer"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={onSort}
                />
              ) : (
                "Reviewer"
              )}
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              {selectable ? (
                <TableCell>
                  <input
                    type="checkbox"
                    role="checkbox"
                    aria-label={`Select ${record.username ?? record.id}`}
                    checked={selectedIds.has(record.id)}
                    onChange={() => toggleOne(record.id)}
                    className="size-4 rounded border-border accent-brand"
                  />
                </TableCell>
              ) : null}
              <TableCell>
                <Avatar className="size-8">
                  <AvatarFallback className="bg-muted text-muted-foreground">
                    <User className="size-4" />
                  </AvatarFallback>
                </Avatar>
              </TableCell>
              <TableCell className="font-medium">
                {record.username ? `@${record.username}` : "—"}
              </TableCell>
              <TableCell>{record.displayName ?? "—"}</TableCell>
              <TableCell>{getReviewImportSourceLabel(record.importSource)}</TableCell>
              <TableCell className="max-w-[160px] truncate">{record.jobName}</TableCell>
              <TableCell>
                <ReviewStatusBadge status={record.reviewStatus} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatReviewDate(record.createdAt)}
              </TableCell>
              <TableCell>{record.reviewer ?? "—"}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  nativeButton={false}
                  render={<Link href={`/review/${record.id}`} />}
                >
                  <Eye className="size-4" />
                  Review
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
