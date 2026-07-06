"use client";

import { useState } from "react";
import { Copy, ExternalLink, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProfileAvatar } from "./ProfileAvatar";
import type { UploadStatus } from "@/lib/types/instagramExtraction";
import type { InstagramResultsViewRow } from "@/lib/types/instagramExtractionQueue";

interface InstagramResultsTableProps {
  rows: InstagramResultsViewRow[];
  uploadStatuses: Record<string, UploadStatus>;
  onRemove: (id: string, extractionId: string | null) => void;
}

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    // Clipboard may be unavailable
  }
}

function formatExtractedAt(iso: string | null): string {
  if (!iso) return "—";
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if (!match) return iso;
  const [, year, month, day, hour, minute] = match;
  return `${year}-${month}-${day} ${hour}:${minute} UTC`;
}

function getUploadStatus(row: InstagramResultsViewRow, uploadStatuses: Record<string, UploadStatus>): UploadStatus {
  if (uploadStatuses[row.id]) {
    return uploadStatuses[row.id];
  }
  if (row.status === "failed") {
    return "failed";
  }
  return "not_uploaded";
}

function uploadStatusLabel(status: UploadStatus): string {
  switch (status) {
    case "uploaded":
      return "Uploaded";
    case "duplicate":
      return "Duplicate";
    case "failed":
      return "Failed";
    default:
      return "Not uploaded";
  }
}

function UploadStatusBadge({ status }: { status: UploadStatus }) {
  if (status === "failed") {
    return <Badge variant="destructive">{uploadStatusLabel(status)}</Badge>;
  }

  return <Badge variant="outline">{uploadStatusLabel(status)}</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "failed") {
    return <Badge variant="destructive">{status}</Badge>;
  }

  if (status === "pending" || status === "running") {
    return <Badge variant="outline">{status}</Badge>;
  }

  if (status === "success" || status === "completed" || status === "mock") {
    return <Badge variant="default">{status}</Badge>;
  }

  return <Badge variant="outline">{status}</Badge>;
}

export function InstagramResultsTable({ rows, uploadStatuses, onRemove }: InstagramResultsTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function handleCopy(id: string, value: string) {
    await copyText(value);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 1500);
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No results yet. Create an extraction job from Instagram Extractor first.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12" />
            <TableHead>Username</TableHead>
            <TableHead>Display Name</TableHead>
            <TableHead>Public Email</TableHead>
            <TableHead>Website</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Upload Status</TableHead>
            <TableHead>Error</TableHead>
            <TableHead>Extracted At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <ProfileAvatar username={row.username} profileImageUrl={row.profileImageUrl} />
              </TableCell>
              <TableCell className="font-medium">@{row.username}</TableCell>
              <TableCell>{row.displayName ?? "—"}</TableCell>
              <TableCell>{row.publicEmail ?? "—"}</TableCell>
              <TableCell className="max-w-[140px] truncate">{row.website ?? "—"}</TableCell>
              <TableCell>
                <StatusBadge status={row.status} />
              </TableCell>
              <TableCell>
                <UploadStatusBadge status={getUploadStatus(row, uploadStatuses)} />
              </TableCell>
              <TableCell className="max-w-[260px] text-sm text-muted-foreground">
                {row.errorCode ? (
                  <span className="font-mono text-xs">{row.errorCode}</span>
                ) : null}
                {row.errorMessage ? (
                  <p className={row.errorCode ? "mt-1" : undefined}>{row.errorMessage}</p>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                {formatExtractedAt(row.extractedAt)}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => window.open(row.profileUrl, "_blank", "noopener,noreferrer")}
                    title="Open Instagram"
                  >
                    <ExternalLink className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => void handleCopy(`${row.id}-user`, row.username)}
                    title="Copy username"
                  >
                    <Copy className="size-4" />
                  </Button>
                  {row.publicEmail ? (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => void handleCopy(`${row.id}-email`, row.publicEmail ?? "")}
                      title="Copy email"
                    >
                      <Copy className="size-4" />
                    </Button>
                  ) : null}
                  {row.extractionId ? (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onRemove(row.id, row.extractionId)}
                      title="Delete result"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  ) : null}
                </div>
                {copiedId?.startsWith(row.id) ? (
                  <p className="mt-1 text-right text-xs text-muted-foreground">Copied</p>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
