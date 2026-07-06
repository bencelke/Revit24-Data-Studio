"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { GooglePlaceRawDocument } from "@/lib/types/google-places";

interface GoogleResultsTableProps {
  places: GooglePlaceRawDocument[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
}

type SortField = "name" | "city" | "rating" | "status";
type SortDirection = "asc" | "desc";

function duplicateLabel(status: GooglePlaceRawDocument["status"]): string {
  if (status === "duplicate") return "Duplicate";
  return "None";
}

function importStatusLabel(status: GooglePlaceRawDocument["status"]): string {
  switch (status) {
    case "imported":
      return "Imported";
    case "queued":
      return "Queued";
    case "rejected":
      return "Rejected";
    case "pending_review":
      return "Pending Review";
    case "approved":
      return "Approved";
    default:
      return "Discovered";
  }
}

export function GoogleResultsTable({
  places,
  selectedIds,
  onSelectionChange,
}: GoogleResultsTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    let result = places.filter((place) => {
      if (statusFilter !== "all" && place.status !== statusFilter) return false;
      if (!query) return true;
      return (
        place.name.toLowerCase().includes(query) ||
        place.city.toLowerCase().includes(query) ||
        place.businessCategory.toLowerCase().includes(query)
      );
    });

    result = [...result].sort((a, b) => {
      const dir = sortDirection === "asc" ? 1 : -1;
      switch (sortField) {
        case "city":
          return a.city.localeCompare(b.city) * dir;
        case "rating":
          return ((a.rating ?? 0) - (b.rating ?? 0)) * dir;
        case "status":
          return a.status.localeCompare(b.status) * dir;
        default:
          return a.name.localeCompare(b.name) * dir;
      }
    });

    return result;
  }, [places, search, statusFilter, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  }

  function toggleRow(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search results..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="discovered">Discovered</option>
          <option value="imported">Imported</option>
          <option value="queued">Queued</option>
          <option value="rejected">Rejected</option>
          <option value="duplicate">Duplicate</option>
        </select>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>
                <button type="button" onClick={() => toggleSort("name")}>
                  Business
                </button>
              </TableHead>
              <TableHead>Category</TableHead>
              <TableHead>
                <button type="button" onClick={() => toggleSort("rating")}>
                  Rating
                </button>
              </TableHead>
              <TableHead>
                <button type="button" onClick={() => toggleSort("city")}>
                  City
                </button>
              </TableHead>
              <TableHead>Website</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Import Status</TableHead>
              <TableHead>Duplicate</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground">
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              pageItems.map((place) => (
                <TableRow key={place.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(place.id)}
                      onChange={() => toggleRow(place.id)}
                      className="size-4 accent-brand"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{place.name}</TableCell>
                  <TableCell>{place.businessCategory}</TableCell>
                  <TableCell>{place.rating?.toFixed(1) ?? "—"}</TableCell>
                  <TableCell>{place.city}</TableCell>
                  <TableCell className="max-w-[140px] truncate">
                    {place.website ? (
                      <a
                        href={place.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand hover:underline"
                      >
                        {place.website.replace(/^https?:\/\//, "")}
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{place.phone ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{importStatusLabel(place.status)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={place.status === "duplicate" ? "destructive" : "secondary"}>
                      {duplicateLabel(place.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      nativeButton={false}
                      render={<Link href={`/google-places/${place.id}`} />}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {filtered.length > pageSize ? (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={safePage <= 1}
            onClick={() => setPage(safePage - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {safePage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={safePage >= totalPages}
            onClick={() => setPage(safePage + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
