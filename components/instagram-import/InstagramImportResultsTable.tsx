"use client";

import { useState } from "react";
import Image from "next/image";
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
import type { InstagramSimpleExtractedRow } from "@/lib/types/instagramSimpleImport";

interface InstagramImportResultsTableProps {
  rows: InstagramSimpleExtractedRow[];
  onRemove: (id: string) => void;
}

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    // Clipboard may be unavailable
  }
}

export function InstagramImportResultsTable({
  rows,
  onRemove,
}: InstagramImportResultsTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function handleCopy(id: string, value: string) {
    await copyText(value);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 1500);
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Extraction results will appear here after you start extraction.
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
            <TableHead>Error</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                {row.profileImageUrl ? (
                  <Image
                    src={row.profileImageUrl}
                    alt={row.username}
                    width={32}
                    height={32}
                    className="size-8 rounded-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                    {row.username.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </TableCell>
              <TableCell className="font-medium">@{row.username}</TableCell>
              <TableCell>{row.displayName ?? "—"}</TableCell>
              <TableCell>{row.publicEmail ?? "—"}</TableCell>
              <TableCell className="max-w-[140px] truncate">{row.website ?? "—"}</TableCell>
              <TableCell>
                <Badge variant={row.extractionStatus === "failed" ? "destructive" : "outline"}>
                  {row.extractionStatus}
                </Badge>
              </TableCell>
              <TableCell className="max-w-[160px] truncate text-muted-foreground">
                {row.error ?? "—"}
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
                    title="Remove row"
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
