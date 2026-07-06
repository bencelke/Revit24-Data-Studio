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
import type { ExtractedInstagramProfile } from "@/lib/types/instagramExtraction";

interface InstagramResultsTableProps {
  rows: ExtractedInstagramProfile[];
  onRemove: (id: string) => void;
}

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    // Clipboard may be unavailable
  }
}

/** Deterministic UTC display — identical on server and client. */
function formatExtractedAt(iso: string): string {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if (!match) return iso;
  const [, year, month, day, hour, minute] = match;
  return `${year}-${month}-${day} ${hour}:${minute} UTC`;
}

export function InstagramResultsTable({ rows, onRemove }: InstagramResultsTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function handleCopy(id: string, value: string) {
    await copyText(value);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 1500);
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No results yet. Extract profiles from Instagram Extractor first.
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
            <TableHead>Profile URL</TableHead>
            <TableHead>Status</TableHead>
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
              <TableCell className="max-w-[160px] truncate text-muted-foreground">
                {row.profileUrl}
              </TableCell>
              <TableCell>
                <Badge variant={row.status === "failed" ? "destructive" : "outline"}>
                  {row.status}
                </Badge>
              </TableCell>
              <TableCell className="max-w-[140px] truncate text-muted-foreground">
                {row.error ?? "—"}
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
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onRemove(row.id)}
                    title="Delete row"
                  >
                    <Trash2 className="size-4" />
                  </Button>
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
