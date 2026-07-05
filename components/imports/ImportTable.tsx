"use client";

import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown, Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ImportStatusBadge } from "./ImportStatusBadge";
import { EmptyState } from "./EmptyState";
import {
  formatImportDate,
  getImportSourceLabel,
  getImportTypeLabel,
} from "@/lib/services/importService";
import type {
  ImportJob,
  ImportSortDirection,
  ImportSortField,
} from "@/lib/types/imports";
import { cn } from "@/lib/utils";

interface ImportTableProps {
  jobs: ImportJob[];
  sortField?: ImportSortField;
  sortDirection?: ImportSortDirection;
  onSort?: (field: ImportSortField) => void;
  showActions?: boolean;
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
  field: ImportSortField;
  sortField?: ImportSortField;
  sortDirection?: ImportSortDirection;
  onSort?: (field: ImportSortField) => void;
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

export function ImportTable({
  jobs,
  sortField,
  sortDirection,
  onSort,
  showActions = true,
  sortable = true,
}: ImportTableProps) {
  if (jobs.length === 0) {
    return (
      <EmptyState
        title="No imports found"
        description="Try adjusting your search or filters to find import jobs."
      />
    );
  }

  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>
              {sortable ? (
                <SortButton
                  label="Name"
                  field="name"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={onSort}
                />
              ) : (
                "Name"
              )}
            </TableHead>
            <TableHead>
              {sortable ? (
                <SortButton
                  label="Source"
                  field="source"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={onSort}
                />
              ) : (
                "Source"
              )}
            </TableHead>
            <TableHead>
              {sortable ? (
                <SortButton
                  label="Type"
                  field="type"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={onSort}
                />
              ) : (
                "Type"
              )}
            </TableHead>
            <TableHead>
              {sortable ? (
                <SortButton
                  label="Status"
                  field="status"
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
                  label="Records"
                  field="totalRecords"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={onSort}
                />
              ) : (
                "Records"
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
                  label="Duration"
                  field="duration"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={onSort}
                />
              ) : (
                "Duration"
              )}
            </TableHead>
            {showActions ? <TableHead className="text-right">Actions</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id}>
              <TableCell className="font-medium">{job.name}</TableCell>
              <TableCell>{getImportSourceLabel(job.source)}</TableCell>
              <TableCell>{getImportTypeLabel(job.type)}</TableCell>
              <TableCell>
                <ImportStatusBadge status={job.status} />
              </TableCell>
              <TableCell>{job.totalRecords.toLocaleString()}</TableCell>
              <TableCell className="text-muted-foreground">
                {formatImportDate(job.createdAt)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {job.duration ?? "—"}
              </TableCell>
              {showActions ? (
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    nativeButton={false}
                    render={<Link href={`/imports/${job.id}`} />}
                    className="gap-1.5"
                  >
                    <Eye className="size-3.5" />
                    View
                  </Button>
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
