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
import { DuplicateConfidenceBadge } from "./DuplicateConfidenceBadge";
import { DuplicateReasonBadges } from "./DuplicateReasonBadges";
import type { DuplicateMatchView, EntityMatchStatus, MatchReason } from "@/lib/types/duplicates";
import type { MatchConfidenceLevel } from "@/lib/types/normalization";
import { getMatchStatusLabel } from "@/lib/services/matchScoringService";
import { formatImportDate } from "@/lib/services/importService";

interface DuplicateMatchesTableProps {
  matches: DuplicateMatchView[];
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  statusFilter?: EntityMatchStatus | "all";
  onStatusFilterChange?: (status: EntityMatchStatus | "all") => void;
  confidenceFilter?: MatchConfidenceLevel | "all";
  onConfidenceFilterChange?: (level: MatchConfidenceLevel | "all") => void;
  reasonFilter?: MatchReason | "all";
  onReasonFilterChange?: (reason: MatchReason | "all") => void;
  search?: string;
  onSearchChange?: (search: string) => void;
}

export function DuplicateMatchesTable({
  matches,
  total,
  page,
  totalPages,
  onPageChange,
  statusFilter = "all",
  onStatusFilterChange,
  confidenceFilter = "all",
  onConfidenceFilterChange,
  reasonFilter = "all",
  onReasonFilterChange,
  search = "",
  onSearchChange,
}: DuplicateMatchesTableProps) {
  const [localSearch, setLocalSearch] = useState(search);

  const reasonOptions = useMemo(
    () => [
      "same_instagram", "same_website", "same_domain", "same_email", "same_phone",
      "same_name_city", "similar_name", "nearby_coordinates", "manual_flag",
    ] as MatchReason[],
    [],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap">
        <Input
          placeholder="Search entities..."
          value={localSearch}
          onChange={(e) => {
            setLocalSearch(e.target.value);
            onSearchChange?.(e.target.value);
          }}
          className="max-w-sm"
        />
        {onConfidenceFilterChange ? (
          <select
            value={confidenceFilter}
            onChange={(e) => onConfidenceFilterChange(e.target.value as MatchConfidenceLevel | "all")}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="all">All confidence</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="possible">Possible</option>
          </select>
        ) : null}
        {onReasonFilterChange ? (
          <select
            value={reasonFilter}
            onChange={(e) => onReasonFilterChange(e.target.value as MatchReason | "all")}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="all">All reasons</option>
            {reasonOptions.map((reason) => (
              <option key={reason} value={reason}>{reason.replace(/_/g, " ")}</option>
            ))}
          </select>
        ) : null}
        {onStatusFilterChange ? (
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as EntityMatchStatus | "all")}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="ignored">Ignored</option>
            <option value="needs_review">Needs Review</option>
          </select>
        ) : null}
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Entity A</TableHead>
              <TableHead>Entity B</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Reasons</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {matches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  No duplicate matches found.
                </TableCell>
              </TableRow>
            ) : (
              matches.map((match) => (
                <TableRow key={match.id}>
                  <TableCell className="font-medium">{match.recordAName}</TableCell>
                  <TableCell>{match.recordBName}</TableCell>
                  <TableCell>
                    <DuplicateConfidenceBadge level={match.confidence} score={match.confidenceScore} />
                  </TableCell>
                  <TableCell>
                    <DuplicateReasonBadges reasons={match.reasons} />
                  </TableCell>
                  <TableCell>{getMatchStatusLabel(match.status)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatImportDate(match.createdAt)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`/duplicates/${match.id}`} />}>
                      Review
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
            Page {page} of {totalPages} · {total} matches
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
