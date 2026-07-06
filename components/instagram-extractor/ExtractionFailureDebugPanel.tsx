"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { ExtractionFailureDebug } from "@/lib/types/instagramExtraction";

interface ExtractionFailureDebugPanelProps {
  failures: ExtractionFailureDebug[];
}

export function ExtractionFailureDebugPanel({ failures }: ExtractionFailureDebugPanelProps) {
  const [expanded, setExpanded] = useState(true);

  if (failures.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        onClick={() => setExpanded((current) => !current)}
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          <span className="text-sm font-medium">Failed profile diagnostics</span>
          <Badge variant="outline">{failures.length}</Badge>
        </div>
      </button>

      {expanded ? (
        <div className="space-y-3 border-t border-border px-4 py-3">
          {failures.map((failure) => (
            <div
              key={`${failure.username}-${failure.errorCode}`}
              className="rounded-md border border-border bg-muted/20 p-3 text-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">@{failure.username}</span>
                <Badge variant="destructive">{failure.status}</Badge>
                <Badge variant="outline">{failure.errorCode}</Badge>
              </div>
              <p className="mt-2 text-muted-foreground">{failure.message}</p>
              <dl className="mt-3 grid gap-1 text-xs text-muted-foreground">
                <div className="flex gap-2">
                  <dt className="w-28 shrink-0">Fetch URL</dt>
                  <dd className="break-all">{failure.fetchUrl}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-28 shrink-0">HTTP status</dt>
                  <dd>{failure.httpStatus ?? "—"}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-28 shrink-0">Parser step</dt>
                  <dd>{failure.step ?? "—"}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
