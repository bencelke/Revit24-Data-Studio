"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Globe } from "lucide-react";
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
import type { WebsiteRawDocument } from "@/lib/types/websites";

interface WebsiteResultsTableProps {
  websites: WebsiteRawDocument[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  duplicateIds?: Set<string>;
}

type SortField = "title" | "city" | "status" | "emails";
type SortDirection = "asc" | "desc";

export function WebsiteResultsTable({
  websites,
  selectedIds,
  onSelectionChange,
  duplicateIds = new Set(),
}: WebsiteResultsTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("title");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    let result = websites.filter((site) => {
      if (statusFilter !== "all" && site.status !== statusFilter) return false;
      if (!query) return true;
      return (
        site.title.toLowerCase().includes(query) ||
        site.domain.toLowerCase().includes(query) ||
        (site.city ?? "").toLowerCase().includes(query)
      );
    });

    result = [...result].sort((a, b) => {
      const dir = sortDirection === "asc" ? 1 : -1;
      switch (sortField) {
        case "city":
          return (a.city ?? "").localeCompare(b.city ?? "") * dir;
        case "status":
          return a.status.localeCompare(b.status) * dir;
        case "emails":
          return (a.publicEmails.length - b.publicEmails.length) * dir;
        default:
          return a.title.localeCompare(b.title) * dir;
      }
    });

    return result;
  }, [websites, search, statusFilter, sortField, sortDirection]);

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

  function toggleAll() {
    if (selectedIds.size === pageItems.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(pageItems.map((site) => site.id)));
    }
  }

  const socialCount = (site: WebsiteRawDocument) =>
    Object.values(site.socialLinks).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search websites..."
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
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="extracted">Extracted</option>
          <option value="imported">Imported</option>
          <option value="queued">Queued</option>
          <option value="duplicate">Duplicate</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  checked={pageItems.length > 0 && selectedIds.size === pageItems.length}
                  onChange={toggleAll}
                  className="size-4 accent-brand"
                />
              </TableHead>
              <TableHead>Website</TableHead>
              <TableHead>
                <button type="button" onClick={() => toggleSort("city")} className="hover:text-foreground">
                  Location
                </button>
              </TableHead>
              <TableHead>
                <button type="button" onClick={() => toggleSort("emails")} className="hover:text-foreground">
                  Contacts
                </button>
              </TableHead>
              <TableHead>Social</TableHead>
              <TableHead>
                <button type="button" onClick={() => toggleSort("status")} className="hover:text-foreground">
                  Status
                </button>
              </TableHead>
              <TableHead>Duplicate</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                  No websites match your filters.
                </TableCell>
              </TableRow>
            ) : (
              pageItems.map((site) => (
                <TableRow key={site.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(site.id)}
                      onChange={() => toggleRow(site.id)}
                      className="size-4 accent-brand"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded border border-border bg-muted/30">
                        {site.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={site.logoUrl} alt="" className="size-6 object-contain" />
                        ) : (
                          <Globe className="size-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{site.title}</p>
                        <p className="text-xs text-muted-foreground">{site.domain}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{[site.city, site.country].filter(Boolean).join(", ") || "—"}</TableCell>
                  <TableCell>
                    {site.publicEmails.length} emails · {site.publicPhones.length} phones
                  </TableCell>
                  <TableCell>{socialCount(site)}</TableCell>
                  <TableCell>{site.status}</TableCell>
                  <TableCell>
                    {duplicateIds.has(site.id) ? (
                      <span className="text-xs text-amber-400">Possible</span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`/websites/${site.id}`} />}>
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Page {safePage} of {totalPages} · {filtered.length} results
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
